"""Restore users and skills into Neo4j from JSON files.

Connects directly to Neo4j — no authentication required.
Skips entries that already exist (by email for users, by name for skills).

Usage:
    uv run python scripts/restore_users_skills.py [--users-file FILE] [--skills-file FILE] [-f|--force]

Defaults:
    --users-file  users_backup.json
    --skills-file skills_backup.json

Options:
    -f, --force   Overwrite existing entries instead of skipping them
"""

import argparse
import json
import sys
from pathlib import Path
from uuid import uuid4

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


def restore_users(input_file: str, force: bool = False) -> tuple[int, int]:
    """Create User nodes from a JSON file.

    Args:
        input_file: Path to the JSON file with user data.
        force: If True, update existing users. If False, skip existing users.

    Returns:
        Tuple of (created, skipped) counts.
    """
    path = Path(input_file)
    if not path.exists():
        print(f"  ⚠ Users file not found: {input_file} — skipping")
        return 0, 0

    users = json.loads(path.read_text())
    created, updated, skipped = 0, 0, 0

    for entry in users:
        email = entry["email"]
        existing_user = UserNode.match(email)

        if existing_user and not force:
            print(f"  ⏭ Skipped (exists): {email}")
            skipped += 1
            continue

        password = entry.get("password", "password123")

        if existing_user and force:
            existing_user.fullname = entry["fullname"]
            existing_user.password = hash_password(password)
            existing_user.merge()
            print(f"  ✓ Updated: {email}")
            updated += 1
        else:
            node = UserNode(
                email=email,
                fullname=entry["fullname"],
                password=hash_password(password),
            )
            node.create()
            print(f"  ✓ Created: {email}")
            created += 1

    return created, skipped


def restore_skills(input_file: str, force: bool = False) -> tuple[int, int]:
    """Create Skill nodes from a JSON file.

    Args:
        input_file: Path to the JSON file with skill data.
        force: If True, update existing skills. If False, skip existing skills.

    Returns:
        Tuple of (created, skipped) counts.
    """
    path = Path(input_file)
    if not path.exists():
        print(f"  ⚠ Skills file not found: {input_file} — skipping")
        return 0, 0

    skills_data = json.loads(path.read_text())
    created, updated, skipped = 0, 0, 0

    for entry in skills_data:
        name = entry["name"]
        existing_skills = SkillNode.match_nodes()
        existing = next((s for s in existing_skills if s.name == name), None)

        if existing and not force:
            print(f"  ⏭ Skipped (exists): {name}")
            skipped += 1
            continue

        if existing and force:
            existing.description = entry["description"]
            existing.content = entry["content"]
            existing.enabled = entry.get("enabled", True)
            existing.merge()
            print(f"  ✓ Updated: {name}")
            updated += 1
        else:
            node = SkillNode(
                uuid=uuid4(),
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
    parser = argparse.ArgumentParser(
        description="Restore users and skills into Neo4j", add_help=True
    )
    parser.add_argument("--users-file", default="users_backup.json", help="Input file for users")
    parser.add_argument("--skills-file", default="skills_backup.json", help="Input file for skills")
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Overwrite existing entries instead of skipping them",
    )
    args = parser.parse_args()

    print("📥 Restoring users and skills into Neo4j...\n")
    connect_db()

    print("👥 Users:")
    u_created, u_skipped = restore_users(args.users_file, args.force)

    print("\n📚 Skills:")
    s_created, s_skipped = restore_skills(args.skills_file, args.force)

    print(f"\n✅ Restore complete")
    print(f"   Users:  {u_created} created, {u_skipped} skipped")
    print(f"   Skills: {s_created} created, {s_skipped} skipped")


if __name__ == "__main__":
    main()
