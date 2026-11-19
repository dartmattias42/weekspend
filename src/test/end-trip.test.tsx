import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// jsdom's HTMLMediaElement.play() is not implemented; the app calls .play().catch()
HTMLMediaElement.prototype.play = function () {
  return Promise.resolve();
};

const renderApp = async () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  await router.load();
  return render(<RouterProvider router={router} />);
};

describe("end trip", () => {
  it("shows the summary, and save trip returns to welcome", async () => {
    await renderApp();

    // welcome -> name -> dates -> type -> dashboard
    fireEvent.click(screen.getByText("new weekend away"));
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText("next"));

    fireEvent.click(screen.getByText("end trip"));
    expect(screen.getByText("who spent what")).toBeTruthy();
    expect(screen.queryByText("end trip")).toBeNull();
    fireEvent.click(screen.getByText("save trip"));

    expect(screen.getByText("new weekend away")).toBeTruthy();
    expect(screen.queryByText("end trip")).toBeNull();
  });
});
