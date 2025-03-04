import {
  VStack,
  Box,
  HStack,
  Text,
  IconButton,
  Input,
  useColorMode,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Annotation } from "../types/project";
import React from "react";

interface AnnotationListProps {
  annotations: Annotation[];
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLabelChange?: (id: string, label: string) => void;
}

const AnnotationList = ({
  annotations,
  onSelect,
  onDelete,
  onLabelChange,
}: AnnotationListProps) => {
  const { colorMode } = useColorMode();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <VStack align="stretch" spacing={2} h={"75"} overflow={"auto"}>
      {annotations.map((annotation) => (
        <Box
          key={annotation.id}
          p={2}
          borderRadius="md"
          bg={colorMode === "dark" ? "gray.700" : "gray.50"}
          _hover={{
            bg: colorMode === "dark" ? "gray.600" : "gray.100",
          }}
          onClick={() => onSelect?.(annotation.id)}
          cursor="pointer"
          transition="all 0.2s"
        >
          <HStack justify="space-between">
            {editingId === annotation.id ? (
              <Input
                size="sm"
                value={annotation.label}
                onChange={(e) => onLabelChange?.(annotation.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingId(null);
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Text fontSize="sm" noOfLines={1}>
                {annotation.label || "未命名"}
              </Text>
            )}
            <HStack spacing={1}>
              <IconButton
                aria-label="编辑标签"
                icon={<FiEdit2 />}
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(annotation.id);
                }}
              />
              <IconButton
                aria-label="删除标注"
                icon={<FiTrash2 />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(annotation.id);
                }}
              />
            </HStack>
          </HStack>
          {annotation.confidence && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              置信度: {(annotation.confidence * 100).toFixed(1)}%
            </Text>
          )}
        </Box>
      ))}
      {annotations.length === 0 && (
        <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
          暂无标注
        </Text>
      )}
    </VStack>
  );
};

export default AnnotationList;
