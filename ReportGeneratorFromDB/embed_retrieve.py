from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pandas as pd
import re

EMBED_MODEL_NAME = "BAAI/bge-small-en-v1.5"  # strong + small + open
TOP_K_TABLES = 10



def build_schema_catalog_from_schema_text(schema_text: str) -> pd.DataFrame:
    rows = []
    for raw in schema_text.strip().splitlines():
        line = raw.strip()
        if not line or line.startswith("..."):
            continue

        # Match: schema.table( ... )
        m = re.match(r"^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\((.*)\)\s*$", line)
        if not m:
            continue

        table_schema, table_name, cols = m.group(1), m.group(2), m.group(3)
        table_text = f"{table_schema}.{table_name}({cols})"
        rows.append({
            "table_schema": table_schema,
            "table_name": table_name,
            "table_text": table_text
        })

    return pd.DataFrame(rows)


def build_faiss_index(table_texts: list[str], embedder: SentenceTransformer):
    # BGE models like the "query: ... / passage: ..." convention (helps retrieval)
    passages = [f"passage: {t}" for t in table_texts]
    embs = embedder.encode(passages, normalize_embeddings=True, show_progress_bar=True)
    embs = np.asarray(embs, dtype="float32")

    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)  # cosine similarity if embeddings normalized
    index.add(embs)
    return index, embs

def retrieve_relevant_tables(user_prompt: str, catalog_df: pd.DataFrame, index, embedder, k: int = TOP_K_TABLES) -> str:
    q = embedder.encode([f"query: {user_prompt}"], normalize_embeddings=True)
    q = np.asarray(q, dtype="float32")
    scores, ids = index.search(q, k)

    # Collect matched tables (keep order by similarity)
    chosen = catalog_df.iloc[ids[0]].copy()
    chosen["score"] = scores[0]
    # Return schema text the LLM will see
    return "\n".join(chosen["table_text"].tolist())
