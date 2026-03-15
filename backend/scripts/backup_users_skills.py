"""Backup users and skills from Neo4j to JSON files.

Connects directly to Neo4j — no authentication required.

Usage:
    uv run python scripts/backup_users_skills.py [--users-file FILE] [--skills-file FILE]

Defaults:
    --users-file  users_backup.json
    --skills-file skills_backup.json
"""

import argparse
import json
import sys
from pathlib import Path

from neontology import Neo4jConfig, init_neontology

# Add parent dir so src imports work when run from backend/
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


def backup_users(output_file: str) -> int:
    """Export all User nodes to a JSON file.

    Passwords are NOT exported for security.

    Args:
        output_file: Destination path for the JSON file.

    Returns:
        Number of users exported.
    """
    nodes = UserNode.match_nodes()
    users = [
        {
            "email": str(node.email),
            "fullname": node.fullname,
        }
        for node in nodes
    ]
    Path(output_file).write_text(json.dumps(users, indent=2, default=str))
    return len(users)


def backup_skills(output_file: str) -> int:
    """Export all Skill nodes to a JSON file.

    Args:
        output_file: Destination path for the JSON file.

    Returns:
        Number of skills exported.
    """
    nodes = SkillNode.match_nodes()
    skills = [
        {
            "name": node.name,
            "description": node.description,
            "content": node.content,
            "enabled": node.enabled,
        }
        for node in nodes
    ]
    Path(output_file).write_text(json.dumps(skills, indent=2, default=str))
    return len(skills)


def main() -> None:
    """Run the backup."""
    parser = argparse.ArgumentParser(description="Backup users and skills from Neo4j")
    parser.add_argument("--users-file", default="users_backup.json", help="Output file for users")
    parser.add_argument("--skills-file", default="skills_backup.json", help="Output file for skills")
    parser.add_argument("-u", "--user", action="store_true", help="Backup also users (name only)")
    args = parser.parse_args()

    print("💾 Backing up users and skills from Neo4j...\n")
    connect_db()
    if args.user:
        user_count = backup_users(args.users_file)
        print(f"  ✓ {user_count} users → {args.users_file}")
    else:
        print('User backup skiped - use -u if you want to save users!\n')

    skill_count = backup_skills(args.skills_file)
    print(f"  ✓ {skill_count} skills → {args.skills_file}")

    print("\n✅ Backup complete")


if __name__ == "__main__":
    main()
