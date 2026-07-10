"use client";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const logout = async () => {
    const { signOutAction } = await import("@/actions/user.actions");
    await signOutAction();
  };

  return <Button onClick={logout}>Logout</Button>;
}
