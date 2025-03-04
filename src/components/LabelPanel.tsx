import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  useColorMode,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Image, Annotation } from "../types/project";
import AutoAnnotateButton from "./AutoAnnotateButton";
import LabelPresets from "./LabelPresets";
import AnnotationStats from "./AnnotationStats";
import AnnotationList from "./AnnotationList";
import useStore from "../store";
import { getLabelColor } from "../utils/colors";
import React from "react";

interface LabelPanelProps {
  visibleImage: Image;
  infraredImage: Image;
  onAnnotationSelect?: (id: string, type: "visible" | "infrared") => void;
  onAnnotationDelete?: (id: string, type: "visible" | "infrared") => void;
  onLabelChange?: (
    annotationId: string,
    label: string,
    type: "visible" | "infrared"
  ) => void;
}

const LabelPanel = ({
  visibleImage,
  infraredImage,
  onAnnotationSelect,
  onAnnotationDelete,
  onLabelChange,
}: LabelPanelProps) => {
  const { colorMode } = useColorMode();
  const [newLabel, setNewLabel] = useState("");

  const handleAddLabel = (label: string) => {
    if (!label.trim()) return;

    const preset = {
      id: Date.now().toString(),
      name: label,
      color: "blue",
    };

    useStore.getState().addLabelPreset(preset);
    setNewLabel("");
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* 固定在顶部的部分 */}
      <Box p={4} borderBottomWidth="1px">
        <LabelPresets />

        <Box mt={4}>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            标签管理
          </Text>
          <HStack>
            <Input
              placeholder="添加新标签"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              size="sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddLabel(newLabel);
                }
              }}
            />
            <IconButton
              aria-label="添加标签"
              icon={<FiPlus />}
              size="sm"
              colorScheme="brand"
              onClick={() => handleAddLabel(newLabel)}
            />
          </HStack>
        </Box>
      </Box>

      {/* 可滚动的部分 */}
      <Box flex="1" overflowY="auto" p={4}>
        <Accordion allowMultiple defaultIndex={[0, 1]}>
          {/* 可见光标注列表 */}
          <AccordionItem border="none">
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="medium">可见光标注</Text>
              </Box>
              <Badge colorScheme="blue">
                {visibleImage.annotations.length}
              </Badge>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <AnnotationList
                annotations={visibleImage.annotations}
                onSelect={(id) => onAnnotationSelect?.(id, "visible")}
                onDelete={(id) => onAnnotationDelete?.(id, "visible")}
                onLabelChange={(id, label) =>
                  onLabelChange?.(id, label, "visible")
                }
              />
            </AccordionPanel>
          </AccordionItem>

          {/* 红外标注列表 */}
          <AccordionItem border="none">
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="medium">红外标注</Text>
              </Box>
              <Badge colorScheme="red">
                {infraredImage.annotations.length}
              </Badge>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <AnnotationList
                annotations={infraredImage.annotations}
                onSelect={(id) => onAnnotationSelect?.(id, "infrared")}
                onDelete={(id) => onAnnotationDelete?.(id, "infrared")}
                onLabelChange={(id, label) =>
                  onLabelChange?.(id, label, "infrared")
                }
              />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <AnnotationStats
          visibleImage={visibleImage}
          infraredImage={infraredImage}
        />

        <Text fontSize="sm" color="gray.500" mt={2}>
          提示：按下 Ctrl+Z (Mac: ⌘+Z) 可以撤销上一次操作
        </Text>
      </Box>
    </Box>
  );
};

const LabelItem = ({
  annotation,
  isSelected,
  onClick,
  onDelete,
  onLabelChange,
}) => {
  return (
    <Flex
      p={2}
      bg={isSelected ? "gray.100" : "transparent"}
      _hover={{ bg: "gray.50" }}
      cursor="pointer"
      onClick={onClick}
      align="center"
    >
      {/* 添加颜色标记 */}
      <Box
        w="3"
        h="3"
        borderRadius="full"
        bg={getLabelColor(annotation.label)}
        mr={2}
      />
      <Text flex="1" fontSize="sm">
        {annotation.label} ({(annotation.confidence * 100).toFixed(0)}%)
      </Text>
      {/* ... 其他代码保持不变 ... */}
    </Flex>
  );
};

export default LabelPanel;
