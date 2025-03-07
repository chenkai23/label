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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tag,
  TagLabel,
  TagRightIcon,
  Stack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Image, Annotation } from "../types/project";
import AutoAnnotateButton from "./AutoAnnotateButton";
import LabelPresets from "./LabelPresets";
import AnnotationStats from "./AnnotationStats";
import AnnotationList from "./AnnotationList";
import useStore from "../store";
import { getLabelColor } from "../utils/colors";
import React from "react";
import { DeleteIcon } from "@chakra-ui/icons";
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
  const currentselectedBoxId = useStore((state) => state.currentselectedBoxId);
  const [newLabel, setNewLabel] = useState("");
  const currentLabel = useStore((state) => state.currentLabel);
  const currentLabelinfo = useMemo(() => {
    let allImagesInfo = visibleImage.annotations.concat(
      infraredImage.annotations
    );
    let labelInfo = allImagesInfo.find(
      (item) => item.id === currentselectedBoxId
    );
    return labelInfo;
  }, [currentselectedBoxId]);
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
      {/* <Box p={4} borderBottomWidth="1px"> */}
      {/* <LabelPresets /> */}

      {/* <Box mt={4}>
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
        </Box> */}
      {/* </Box> */}

      {/* 可滚动的部分 */}
      <Box flex="1" overflowY="auto" p={4}>
        <Accordion allowMultiple defaultIndex={[0, 1]}>
          <Tabs variant="enclosed">
            <TabList>
              <Tab>可见光标注</Tab>
              <Tab>红外标注</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="medium">标注列表</Text>
                </Box>
                <Box overflowY={"auto"} height={90} marginTop={2}>
                  <Stack
                    direction={["column", "row"]}
                    spacing={2}
                    flexWrap={"wrap"}
                  >
                    {visibleImage.annotations.map((annotation) => {
                      return (
                        <Tag
                          cursor={"pointer"}
                          size="md"
                          variant="subtle"
                          bg={annotation.color}
                          _hover={{
                            opacity: 0.8,
                          }}
                          opacity={
                            currentselectedBoxId === annotation.id ? 0.4 : 1
                          }
                          onClick={() =>
                            onAnnotationSelect?.(annotation.id, "visible")
                          }
                          key={annotation.id}
                        >
                          <TagLabel>
                            {annotation.label}&nbsp;
                            {annotation.confidence
                              ? `(置信度:
                            ${annotation.confidence})`
                              : ""}
                          </TagLabel>
                          <TagRightIcon
                            cursor={"pointer"}
                            boxSize="12px"
                            as={DeleteIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAnnotationDelete?.(annotation.id, "visible");
                            }}
                          />
                        </Tag>
                      );
                    })}
                  </Stack>
                </Box>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="medium">标注信息</Text>
                </Box>
                <Box marginTop={2} height={120}>
                  {currentLabelinfo ? (
                    <VStack align="stretch" spacing={4}>
                      <Tag size="sm">X: {currentLabelinfo?.bbox[0]}</Tag>

                      <Tag size="sm">Y: {currentLabelinfo?.bbox[1]}</Tag>
                      <Tag size="sm">W: {currentLabelinfo?.bbox[2]}</Tag>
                      <Tag size="sm">H: {currentLabelinfo?.bbox[3]}</Tag>
                    </VStack>
                  ) : (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      textAlign="center"
                      py={4}
                    >
                      请选择标注框
                    </Text>
                  )}
                </Box>
              </TabPanel>
              <TabPanel>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="medium">标注列表</Text>
                </Box>
                <Box overflowY={"auto"} height={90} marginTop={2}>
                  <Stack
                    direction={["column", "row"]}
                    spacing={2}
                    flexWrap={"wrap"}
                  >
                    {infraredImage.annotations.map((annotation) => {
                      return (
                        <Tag
                          cursor={"pointer"}
                          size="md"
                          variant="subtle"
                          bg={annotation.color}
                          _hover={{
                            opacity: 0.8,
                          }}
                          opacity={
                            currentselectedBoxId === annotation.id ? 0.4 : 1
                          }
                          onClick={() =>
                            onAnnotationSelect?.(annotation.id, "infrared")
                          }
                          key={annotation.id}
                        >
                          <TagLabel>
                            {annotation.label}&nbsp;
                            {annotation.confidence
                              ? `(置信度:
                            ${annotation.confidence})`
                              : ""}
                          </TagLabel>
                          <TagRightIcon
                            cursor={"pointer"}
                            boxSize="12px"
                            as={DeleteIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAnnotationDelete?.(annotation.id, "infrared");
                            }}
                          />
                        </Tag>
                      );
                    })}
                  </Stack>
                </Box>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="medium">标注信息</Text>
                </Box>
                <Box marginTop={2} height={120}>
                  {currentLabelinfo ? (
                    <VStack align="stretch" spacing={4}>
                      <Tag size="sm">X: {currentLabelinfo?.bbox[0]}</Tag>

                      <Tag size="sm">Y: {currentLabelinfo?.bbox[1]}</Tag>
                      <Tag size="sm">W: {currentLabelinfo?.bbox[2]}</Tag>
                      <Tag size="sm">H: {currentLabelinfo?.bbox[3]}</Tag>
                    </VStack>
                  ) : (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      textAlign="center"
                      py={4}
                    >
                      请选择标注框
                    </Text>
                  )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
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
