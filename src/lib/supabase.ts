// Supabase has been removed in favor of Firebase.
// Any import from this module indicates a remaining migration spot.
export const supabase = new Proxy({}, {
  get() {
    throw new Error('Supabase has been removed. Use Firebase via src/lib/firebase instead.');
  }
}) as unknown as any;
