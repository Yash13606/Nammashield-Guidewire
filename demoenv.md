# Frontend app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ML_API_URL=http://localhost:5000

# Backend database (Railway PostgreSQL)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME

# Backend-only ML base URL (recommended on Railway)
ML_API_URL=http://127.0.0.1:5000

# Legacy Supabase vars (keep only during migration window)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Weather ingestion / trigger verification
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key

# Mock payout behavior (0.0 to 1.0)
MOCK_UPI_FAIL_RATE=0.15
