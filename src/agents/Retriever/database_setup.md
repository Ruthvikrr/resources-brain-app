# Next Steps: Vector Embedding Database Configuration

To build the Retriever Agent, we must first empower your Supabase database mathematically understand human language constraints (known as Semantic Vector Search). 

We will use the ultra-fast `pgvector` extension.

### What to do:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects).
2. Click into your **Project**.
3. On the left sidebar, click the **SQL Editor** (it looks like a `>_` terminal icon).
4. Click **New Query**.
5. Paste the exact SQL code below and hit the green **Run** button!

```sql
-- 1. Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 2. Add an embedding column to our existing resources table
-- We use 384 dimensions because that is the size of the all-MiniLM model we will use
alter table resources add column if not exists embedding vector(384);

-- 3. Create a RAG function to search for relevant knowledge dynamically!
create or replace function match_resources (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  url text,
  title text,
  summary text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    resources.id,
    resources.url,
    resources.title,
    resources.summary,
    resources.raw_content as content,
    1 - (resources.embedding <=> query_embedding) as similarity
  from resources
  where 1 - (resources.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

Once this is run, your database is officially configured as an AI Vector DB!
