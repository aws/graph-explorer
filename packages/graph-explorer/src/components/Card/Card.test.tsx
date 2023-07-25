import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<Card className="test-class">Test content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("test-class");
  });

  it("applies elevation", () => {
    render(<Card elevation={3}>Test content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("card-elevation-3");
  });

  it("applies transparent", () => {
    render(<Card transparent>Test content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("card-transparent");
  });

  it("applies disablePadding", () => {
    render(<Card disablePadding>Test content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("card-disable-padding");
  });

  it("applies onClick", () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Test content</Card>);
    userEvent.click(screen.getByTestId("card"));
    expect(handleClick).toHaveBeenCalled();
  });
});
