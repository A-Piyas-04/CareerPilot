import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/app/login/login-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => new URLSearchParams("next=/dashboard"),
}));

vi.mock("@/lib/auth/client-session", () => ({
  getOptionalClientUser: vi.fn(async () => null),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/client");
const { getOptionalClientUser } = await import("@/lib/auth/client-session");

describe("LoginForm", () => {
  const signInWithPassword = vi.fn();
  const signUp = vi.fn();

  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    signInWithPassword.mockReset();
    signUp.mockReset();
    vi.mocked(getOptionalClientUser).mockResolvedValue(null);
    vi.mocked(createClient).mockReturnValue({
      auth: { signInWithPassword, signUp },
    } as never);
  });

  it("renders sign-in mode by default", async () => {
    render(<LoginForm />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(within(document.querySelector("form") as HTMLElement).getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("switches to sign-up mode when tab clicked", async () => {
    render(<LoginForm />);

    await waitFor(() => screen.getByRole("button", { name: /create account/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /create account/i })[0]);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /get started free/i })).toBeInTheDocument();
  });

  it("submits sign-in credentials", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    render(<LoginForm />);
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret123" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalled());
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
    });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error message on failed sign-in", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid credentials" },
    });

    render(<LoginForm />);
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "wrong" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() =>
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument(),
    );
  });
});
