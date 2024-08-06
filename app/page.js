"use client";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const supabase = createClient(
  "https://rhvbaatuqzvuchhbppih.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodmJhYXR1cXp2dWNoaGJwcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI3MzQ4MzcsImV4cCI6MjAzODMxMDgzN30.TEY4i3pkT_bdj488WYMqpeJT1YGzk3YNAmuCTwM442c"
);

export default function Index() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const data = await supabase.auth.getSession();
      console.log("session", data);
      setSession(data);
      if (session) {
        router.push("/Home");
      }
      setUser(data);
    };

    fetchSession();

    const data = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("session", data);
      setSession(data);
      setUser(data?.user);
      if (session) {
        router.push("/home");
      }
    });
  }, []);

  return (
    <>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={["google", "facebook", "twitter"]}
      />
    </>
  );
}
