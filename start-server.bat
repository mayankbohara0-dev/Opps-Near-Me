@echo off
cd /d "c:\Users\Mayank-Pc\Downloads\Hardik\local-opportunities-finder"

:: Disable Next.js telemetry (stops background telemetry network calls)
set NEXT_TELEMETRY_DISABLED=1
set SUPABASE_TELEMETRY_DISABLED=1
set UV_THREADPOOL_SIZE=4

:: Limit Node.js heap to 4096MB to prevent it from consuming all RAM
set NODE_OPTIONS=--max-old-space-size=4096

:: Start dev server without Turbopack to prevent system freezes
:: Output goes to terminal
npm run dev
