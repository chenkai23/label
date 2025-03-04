import { VStack, IconButton, Tooltip, useColorMode } from "@chakra-ui/react";
import React from "react";
import { FiSquare, FiMove } from "react-icons/fi";

interface AnnotationToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const AnnotationToolbar = ({
  currentTool,
  onToolChange,
}: AnnotationToolbarProps) => {
  const { colorMode } = useColorMode();

  const tools = [
    {
      id: "move",
      icon: <FiMove />,
      label: "移动工具",
    },
    {
      id: "rectangle",
      icon: <FiSquare />,
      label: "矩形标注",
    },
  ];

  return (
    <VStack spacing={2}>
      {tools.map((tool) => (
        <Tooltip key={tool.id} label={tool.label} placement="right">
          <IconButton
            aria-label={tool.label}
            icon={tool.icon}
            variant={currentTool === tool.id ? "solid" : "ghost"}
            colorScheme={currentTool === tool.id ? "brand" : undefined}
            onClick={() => onToolChange(tool.id)}
          />
        </Tooltip>
      ))}
    </VStack>
  );
};

export default AnnotationToolbar;
