'use client';
import React from 'react';
import { supabase } from '../lib/supabaseClient';

type AuthContextType = {
	user: any | null;
	loading: boolean;
};

export const AuthContext = React.createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = React.useState<any | null>(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (!supabase) {
			setLoading(false);
			return;
		}
		supabase.auth.getSession().then(({ data }) => {
			setUser(data.session?.user ?? null);
			setLoading(false);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});
		return () => {
			sub.subscription.unsubscribe();
		};
	}, []);

	return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}


