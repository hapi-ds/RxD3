from neontology import Neo4jConfig, init_neontology

from src.config.config import settings

print("Database config:", settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)

config = Neo4jConfig(
    uri=settings.neo4j_uri,
    username=settings.neo4j_username,
    password=settings.neo4j_password
)


def initiate_database():
    init_neontology(config)
