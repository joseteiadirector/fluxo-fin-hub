import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "moderator" | "user" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .order("role", { ascending: false }) // admin > moderator > user
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setRole(data?.role || "user");
      } catch (error) {
        console.error("Erro ao buscar role do usuário:", error);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Configurar listener para mudanças de role
    const channel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchUserRole()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  return { role, loading, isAdmin, isModerator };
};
