import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { PlaceholderPage } from "./PlaceholderPage"

afterEach(cleanup)

describe("PlaceholderPage", () => {
  it("explains a later module without pretending it is complete", () => {
    render(<PlaceholderPage route="grades" />)

    expect(screen.getByRole("heading", { name: "数据周报" })).toBeInTheDocument()
    expect(screen.getByText("该模块将在后续版本开放")).toBeInTheDocument()
  })
})
