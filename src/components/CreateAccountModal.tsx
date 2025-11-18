import React, { useMemo, useState } from "react";
import { API_FULL_URL } from "../config";
import Platform, { getPlatformDisplayName } from "../types/platform";
import {
  PendingAccountInfo,
  clearPendingAccount,
} from "../handler/pendingAccount";

const getProviderName = (provider: Platform): string => {
  try {
    return getPlatformDisplayName(provider);
  } catch {
    return provider;
  }
};
interface CreateAccountModalProps {
  pendingAccount: PendingAccountInfo;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ pendingAccount }) => {
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const providerName = useMemo(
    () => getProviderName(pendingAccount.provider),
    [pendingAccount.provider],
  );

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please choose a username before continuing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_FULL_URL}/api/oauth/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: pendingAccount.state,
          username: trimmedUsername,
        }),
      });

      if (response.status === 409) {
        setError("That username is already taken. Try another one.");
        return;
      }

      if (response.status !== 201 && response.status !== 200) {
        setError("Unable to create account right now. Please try again.");
        return;
      }

      let data: { jwt?: string } = {};
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse /oauth/create-account response", parseError);
      }

      const token = data.jwt;
      if (token) {
        localStorage.setItem("token", token);
      }

      clearPendingAccount();
      window.dispatchEvent(new Event("auth-changed"));
    } catch (err) {
      console.error("Failed to create account", err);
      setError("Something went wrong while creating your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-lg rounded-xl border p-8 shadow-2xl color bg-bg1 border-(--border-color) color-[--text-color]"
      >
        <h2 className="text-2xl font-semibold mb-4 text-secondary">Create your SyncraSong account</h2>
        <p className="mb-6 text-sm leading-6 text-secondary">
          We couldn&apos;t find an existing SyncraSong account for your {providerName} login. Choose a username
          below to finish setting up your account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-secondary">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-md border p-3 text-base outline-none bg-(--input-bg) border-(--accent-color) color-[--text-color] focus:border-(--accent-color) transition text-secondary"
              placeholder="your_username"
              autoFocus
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-500 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md p-3 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 bg-bg5/40"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountModal;
