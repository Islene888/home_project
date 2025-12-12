import { Separator, Text } from "@radix-ui/themes";
import { useId } from "react";
import type { ReactNode } from "react";

interface RightPanelSectionProps {
  title?: string;
  children: ReactNode;
}

export const RightPanelSection = ({
  title,
  children,
}: RightPanelSectionProps) => {
  const titleId = useId();

  return (
    <>
      <section
        aria-labelledby={title ? titleId : undefined}
        style={{ marginBottom: "8px" }}
      >
        {title && (
          <Text
            id={titleId}
            size="3"
            weight="bold"
            as="div"
            mb="2"
            role="heading"
            aria-level={3}
          >
            {title}
          </Text>
        )}
        {children}
      </section>
      <Separator
        size="4"
        style={{ marginBottom: "20px" }}
        aria-hidden="true"
        role="separator"
      />
    </>
  );
};
