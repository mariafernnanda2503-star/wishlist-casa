// Credenciais do projeto Supabase.
// A "anon key" é pública por design (protegida pelas regras de Row Level Security
// que criamos no banco) — pode ficar exposta no front-end sem problema.
const SUPABASE_URL = 'https://fneecsvflmvgmuyciwfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZWVjc3ZmbG12Z211eWNpd2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTk3ODEsImV4cCI6MjEwMjIzNTc4MX0.YZm0ESRguq2qnpyuGc6T1U_3PT-pKhczUyYGs3ev-GE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
