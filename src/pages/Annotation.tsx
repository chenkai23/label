import {
  Box,
  Flex,
  useColorMode,
  IconButton,
  Tooltip,
  VStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiMaximize } from "react-icons/fi";
import { useStore } from "../store";
import AnnotationCanvas from "../components/AnnotationCanvas";
import AnnotationToolbar from "../components/AnnotationToolbar";
import LabelPanel from "../components/LabelPanel";
import { Annotation } from "../types/project";
import AutoAnnotateButton from "../components/AutoAnnotateButton";
import React from "react";

const AnnotationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const [scale, setScale] = useState(1);
  const [currentTool, setCurrentTool] = useState("move");
  const [selectedId, setSelectedId] = useState<{
    id: string;
    type: "visible" | "infrared";
  } | null>(null);
  const toast = useToast();

  // 获取当前项目和图片对
  const project = useStore((state) =>
    state.projects.find((p) =>
      p.imagePairs?.some(
        (pair) => pair.visibleImage.id === id || pair.infraredImage.id === id
      )
    )
  );

  const imagePair = project?.imagePairs?.find(
    (pair) => pair.visibleImage.id === id || pair.infraredImage.id === id
  );

  // 处理标注变更
  const handleAnnotationChange = async (
    newAnnotations: Annotation[],
    type: "visible" | "infrared"
  ) => {
    if (!imagePair) return;

    try {
      useStore.getState().updateAnnotations(imagePair.id, type, newAnnotations);

      toast({
        title: "保存成功",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        status: "error",
        duration: 2000,
      });
    }
  };

  // 处理标注同步
  const handleSyncAnnotation = (
    annotation: Annotation,
    type: "visible" | "infrared"
  ) => {
    if (!imagePair) return;

    const otherType = type === "visible" ? "infrared" : "visible";
    const otherImage =
      type === "visible" ? imagePair.infraredImage : imagePair.visibleImage;

    const newAnnotations = [...otherImage.annotations];
    const index = newAnnotations.findIndex((a) => a.id === annotation.id);

    if (index !== -1) {
      newAnnotations[index] = { ...annotation };
      handleAnnotationChange(newAnnotations, otherType);
    }
  };

  if (!project || !imagePair) {
    return (
      <Box
        h="calc(100vh - 64px)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text>图片不存在</Text>
      </Box>
    );
  }

  return (
    <Flex h="calc(100vh - 64px)" overflow="hidden">
      {/* 左侧工具栏 */}
      <VStack
        w="64px"
        bg={colorMode === "dark" ? "gray.800" : "white"}
        borderRight="1px"
        borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
        py={4}
        spacing={4}
      >
        <Tooltip label="返回项目" placement="right">
          <IconButton
            aria-label="返回项目"
            icon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => navigate(`/projects/${project.id}`)}
          />
        </Tooltip>
        <Tooltip label="放大" placement="right">
          <IconButton
            aria-label="放大"
            icon={<FiZoomIn />}
            variant="ghost"
            onClick={() => setScale((s) => Math.min(s + 0.1, 3))}
          />
        </Tooltip>
        <Tooltip label="缩小" placement="right">
          <IconButton
            aria-label="缩小"
            icon={<FiZoomOut />}
            variant="ghost"
            onClick={() => setScale((s) => Math.max(s - 0.1, 0.1))}
          />
        </Tooltip>
        <Tooltip label="适应屏幕" placement="right">
          <IconButton
            aria-label="适应屏幕"
            icon={<FiMaximize />}
            variant="ghost"
            onClick={() => setScale(1)}
          />
        </Tooltip>
        <AnnotationToolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
        />
        <AutoAnnotateButton
          visibleImage={imagePair.visibleImage}
          infraredImage={imagePair.infraredImage}
          onAnnotationsChange={(annotations, type) =>
            handleAnnotationChange(annotations, type)
          }
        />
      </VStack>

      {/* 中间双画布区域 */}
      <Flex flex="1" bg={colorMode === "dark" ? "gray.900" : "gray.50"}>
        {/* 可见光画布 */}
        <Box
          flex="1"
          borderRight="1px"
          borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
        >
          <Text p={2} fontSize="sm" color="gray.500">
            可见光图像
          </Text>
          <AnnotationCanvas
            key={`visible-${imagePair.visibleImage.id}`}
            image={imagePair.visibleImage}
            scale={scale}
            tool={currentTool}
            setTool={setCurrentTool}
            onAnnotationChange={(annotations) =>
              handleAnnotationChange(annotations, "visible")
            }
            syncAnnotation={(annotation) =>
              handleSyncAnnotation(annotation, "visible")
            }
            selectedId={selectedId?.type === "visible" ? selectedId.id : null}
          />
        </Box>

        {/* 红外画布 */}
        <Box flex="1">
          <Text p={2} fontSize="sm" color="gray.500">
            红外图像
          </Text>
          <AnnotationCanvas
            key={`infrared-${imagePair.infraredImage.id}`}
            image={imagePair.infraredImage}
            scale={scale}
            tool={currentTool}
            setTool={setCurrentTool}
            onAnnotationChange={(annotations) =>
              handleAnnotationChange(annotations, "infrared")
            }
            syncAnnotation={(annotation) =>
              handleSyncAnnotation(annotation, "infrared")
            }
            selectedId={selectedId?.type === "infrared" ? selectedId.id : null}
          />
        </Box>
      </Flex>

      {/* 右侧标签面板 */}
      <Box
        w="300px"
        bg={colorMode === "dark" ? "gray.800" : "white"}
        borderLeft="1px"
        borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
      >
        <LabelPanel
          visibleImage={imagePair.visibleImage}
          infraredImage={imagePair.infraredImage}
          onAnnotationSelect={(id, type) => setSelectedId({ id, type })}
          onAnnotationDelete={(id, type) => {
            const image =
              type === "visible"
                ? imagePair.visibleImage
                : imagePair.infraredImage;
            const newAnnotations = image.annotations.filter((a) => a.id !== id);
            handleAnnotationChange(newAnnotations, type);
          }}
          onLabelChange={(id, label, type) => {
            const image =
              type === "visible"
                ? imagePair.visibleImage
                : imagePair.infraredImage;
            const newAnnotations = image.annotations.map((a) =>
              a.id === id ? { ...a, label } : a
            );
            handleAnnotationChange(newAnnotations, type);
          }}
        />
      </Box>
    </Flex>
  );
};

export default AnnotationPage;
