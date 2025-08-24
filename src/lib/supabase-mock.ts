// Mock Supabase client for development when production URL is not available
export const createMockSupabaseClient = () => {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log('Mock login attempt:', email);
        // Simulate successful login for development
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: email,
              role: 'authenticated'
            },
            session: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token'
            }
          },
          error: null
        };
      },
      signOut: async () => {
        console.log('Mock logout');
        return { error: null };
      },
      getSession: async () => {
        return {
          data: { session: null },
          error: null
        };
      },
      onAuthStateChange: (callback: any) => {
        // Simulate initial session check
        setTimeout(() => callback('INITIAL_SESSION', null), 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            console.log(`Mock query from ${table}`);
            return { data: null, error: null };
          }
        })
      }),
      insert: () => ({
        select: () => ({
          single: async () => {
            console.log(`Mock insert to ${table}`);
            return { data: { id: 'mock-id' }, error: null };
          }
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => {
              console.log(`Mock update in ${table}`);
              return { data: { id: 'mock-id' }, error: null };
            }
          })
        })
      }),
      upsert: () => ({
        select: () => ({
          single: async () => {
            console.log(`Mock upsert in ${table}`);
            return { data: { id: 'mock-id' }, error: null };
          }
        })
      })
    })
  };
};
