"""Restore users and skills into Neo4j from JSON files.

Connects directly to Neo4j — no authentication required.
Skips entries that already exist (by email for users, by name for skills).

Usage:
    uv run python scripts/restore_users_skills.py [--users-file FILE] [--skills-file FILE]

Defaults:
    --users-file  users_backup.json
    --skills-file skills_backup.json
"""

import argparse
import json
import sys
from pathlib import Path

import bcrypt
from neontology import Neo4jConfig, init_neontology

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config.config import settings
from src.models.skill import SkillNode
from src.models.user import UserNode


def connect_db() -> None:
    """Initialize the Neo4j connection."""
    config = Neo4jConfig(
        uri=settings.neo4j_uri,
        username=settings.neo4j_username,
        password=settings.neo4j_password,
    )
    init_neontology(config)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def restore_users(input_file: str) -> tuple[int, int]:
    """Create User nodes from a JSON file.

    Args:
        input_file: Path to the JSON file with user data.

    Returns:
        Tuple of (created, skipped) counts.
    """
    path = Path(input_file)
    if not path.exists():
        print(f"  ⚠ Users file not found: {input_file} — skipping")
        return 0, 0

    users = json.loads(path.read_text())
    created, skipped = 0, 0

    for entry in users:
        email = entry["email"]
        if UserNode.match(email):
            print(f"  ⏭ Skipped (exists): {email}")
            skipped += 1
            continue

        password = entry.get("password", "password123")
        node = UserNode(
            email=email,
            fullname=entry["fullname"],
            password=hash_password(password),
        )
        node.create()
        print(f"  ✓ Created: {email}")
        created += 1

    return created, skipped


def restore_skills(input_file: str) -> tuple[int, int]:
    """Create Skill nodes from a JSON file.

    Args:
        input_file: Path to the JSON file with skill data.

    Returns:
        Tuple of (created, skipped) counts.
    """
    path = Path(input_file)
    if not path.exists():
        print(f"  ⚠ Skills file not found: {input_file} — skipping")
        return 0, 0

    skills = json.loads(path.read_text())
    created, skipped = 0, 0

    for entry in skills:
        name = entry["name"]
        existing = SkillNode.match_nodes()
        if any(s.name == name for s in existing):
            print(f"  ⏭ Skipped (exists): {name}")
            skipped += 1
            continue

        node = SkillNode(
            name=name,
            description=entry["description"],
            content=entry["content"],
            enabled=entry.get("enabled", True),
        )
        node.create()
        print(f"  ✓ Created: {name}")
        created += 1

    return created, skipped


def main() -> None:
    """Run the restore."""
    parser = argparse.ArgumentParser(description="Restore users and skills into Neo4j")
    parser.add_argument("--users-file", default="users_backup.json", help="Input file for users")
    parser.add_argument("--skills-file", default="skills_backup.json", help="Input file for skills")
    args = parser.parse_args()

    print("📥 Restoring users and skills into Neo4j...\n")
    connect_db()

    print("👥 Users:")
    u_created, u_skipped = restore_users(args.users_file)

    print("\n📚 Skills:")
    s_created, s_skipped = restore_skills(args.skills_file)

    print(f"\n✅ Restore complete")
    print(f"   Users:  {u_created} created, {u_skipped} skipped")
    print(f"   Skills: {s_created} created, {s_skipped} skipped")


if __name__ == "__main__":
    main()
