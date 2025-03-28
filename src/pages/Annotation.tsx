import {
  Box,
  Flex,
  useColorMode,
  IconButton,
  Tooltip,
  VStack,
  Text,
  useToast,
  HStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  TagRightIcon,
  Stack,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiMaximize, FiArrowRight } from "react-icons/fi";
import { useStore } from "../store";
import AnnotationCanvas from "../components/AnnotationCanvas";
import AnnotationToolbar from "../components/AnnotationToolbar";
import LabelPanel from "../components/LabelPanel";
import { Annotation } from "../types/project";
import AutoAnnotateButton from "../components/AutoAnnotateButton";
import React from "react";
import { DeleteIcon } from "@chakra-ui/icons";
import {
  getImageGroupsInfo,
  getProjectInfo,
  manualAnnotations,
} from "../services/http";
import { cloneDeep } from "lodash";
const AnnotationPage = () => {
  const internalSelectedId = useStore((state) => state.currentselectedBoxId);
  const setInternalSelectedId = useStore(
    (state) => state.setCurrentselectedBoxId
  );
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const [scale, setScale] = useState(1);
  const [currentTool, setCurrentTool] = useState("move");
  const currentLabel = useStore((state) => state.currentLabel);
  const setCurrentLabel = useStore((state) => state.setCurrentLabel);
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<{
    id: string;
    type: "visible" | "infrared";
  } | null>(null);
  const toast = useToast();
  const [projectInfo, setProjectInfo] = useState<any>();
  const [allGroupIds, setAllGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // 获取当前项目和图片对
  // const project = useStore((state) =>
  //   state.projects.find((p) =>
  //     p.imagePairs?.some(
  //       (pair) => pair.visibleImage.id === id || pair.infraredImage.id === id
  //     )
  //   )
  // );

  // const imagePair = project?.imagePairs?.find(
  //   (pair) => pair.visibleImage.id === id || pair.infraredImage.id === id
  // );

  // const imagePair: any = {
  //   id: id,
  //   visibleImage: {
  //     annotations: [],
  //     id: projectInfo?.visibleImageId,
  //     url: projectInfo?.visibleImageId,
  //     name: projectInfo?.visibleImageId,
  //     type: "visible",
  //   },
  //   infraredImage: {
  //     annotations: [],
  //     id: projectInfo?.infraredImageId,
  //     url: projectInfo?.infraredImageId,
  //     name: projectInfo?.infraredImageId,
  //     type: "infrared",
  //   },
  // };

  const [imagePair, setImagePair] = useState<any>();
  // 添加状态来跟踪哪些是自动标注的框
  const [autoAnnotationIds, setAutoAnnotationIds] = useState<{visible: string[], infrared: string[]}>({
    visible: [],
    infrared: []
  });
  const initAnnotationHistory = useStore(
    (state) => state.initAnnotationHistory
  );
  const updateAnnotations = useStore((state) => state.updateAnnotations);
  useEffect(() => {
    setCurrentLabel(null);
    setLoading(true);
    getImageGroupsInfo({ groupId: id }).then((res) => {
      setProjectInfo(res);
      getProjectInfo({ projectId: res?.projectId }).then((res) => {
        setPresets(res?.tags);
        // 获取所有图片组ID并排序
        if (res?.imageGroups) {
          const groupIds = res.imageGroups.map(group => group.id.toString());
          setAllGroupIds(groupIds.sort((a, b) => Number(a) - Number(b)));
        }
        setLoading(false);
      });
      let visible = res?.manualAnnotations.visible
        ? res?.manualAnnotations.visible
        : [];
      let infrared = res?.manualAnnotations.infrared
        ? res?.manualAnnotations.infrared
        : [];
      let yoloVisible = res?.yoloData.visible ? res?.yoloData.visible : [];
      let yoloInfrared = res?.yoloData.infrared ? res?.yoloData.infrared : [];
      
      // 记录自动标注的ID
      setAutoAnnotationIds({
        visible: yoloVisible.map(item => item.id),
        infrared: yoloInfrared.map(item => item.id)
      });
      
      let vAnnotations = visible.concat(yoloVisible);
      let iAnnotations = infrared.concat(yoloInfrared);
      setImagePair({
        visibleImage: {
          annotations: vAnnotations,
          id: res?.visibleImageId,
          url: res?.visibleImageId,
          name: res?.visibleImageId,
          type: "visible",
        },
        infraredImage: {
          annotations: iAnnotations,
          id: res?.infraredImageId,
          url: res?.infraredImageId,
          name: res?.infraredImageId,
          type: "infrared",
        },
      });
      initAnnotationHistory();
      updateAnnotations({
        visibleImage: {
          annotations: vAnnotations,
          id: res?.visibleImageId,
          url: res?.visibleImageId,
          name: res?.visibleImageId,
          type: "visible",
        },
        infraredImage: {
          annotations: iAnnotations,
          id: res?.infraredImageId,
          url: res?.infraredImageId,
          name: res?.infraredImageId,
          type: "infrared",
        },
      } as any);
    });
  }, [id, initAnnotationHistory, updateAnnotations]);

  // 获取当前组在所有组中的索引
  const currentIndex = useMemo(() => {
    return allGroupIds.indexOf(id);
  }, [allGroupIds, id]);

  // 计算上一组和下一组的ID
  const prevGroupId = useMemo(() => {
    return currentIndex > 0 ? allGroupIds[currentIndex - 1] : null;
  }, [allGroupIds, currentIndex]);

  const nextGroupId = useMemo(() => {
    return currentIndex < allGroupIds.length - 1 ? allGroupIds[currentIndex + 1] : null;
  }, [allGroupIds, currentIndex]);
  
  // 处理导航到上一组和下一组
  const handleNavigateToPrev = useCallback(() => {
    if (prevGroupId) {
      navigate(`/annotation/${prevGroupId}`);
    }
  }, [navigate, prevGroupId]);

  const handleNavigateToNext = useCallback(() => {
    if (nextGroupId) {
      navigate(`/annotation/${nextGroupId}`);
    }
  }, [navigate, nextGroupId]);

  // 处理标注变更
  const handleAnnotationChange = async (
    newAnnotations: Annotation[],
    type: "visible" | "infrared"
  ) => {
    if (!(projectInfo.visibleImageId || projectInfo.infraredImageId)) return;

    try {
      let cloneImagePair = cloneDeep(imagePair);
      
      // 分离手动标注和自动标注数据
      const originalAnnotations = type === "visible" 
        ? imagePair.visibleImage.annotations 
        : imagePair.infraredImage.annotations;
      
      // 找出被删除的注释框ID
      const originalIds = originalAnnotations.map(a => a.id);
      const newIds = newAnnotations.map(a => a.id);
      const deletedIds = originalIds.filter(id => !newIds.includes(id));
      
      // 检查是否是自动标注被修改
      const isAutoAnnotationModified = deletedIds.some(id => 
        autoAnnotationIds[type].includes(id)
      );
      
      const isModifyingAutoAnnotations = newAnnotations.some(anno => 
        autoAnnotationIds[type].includes(anno.id)
      );
      
      if (type === "visible") {
        const newImagePair = {
          ...imagePair,
          visibleImage: {
            ...imagePair.visibleImage,
            annotations: newAnnotations,
          },
        };
        useStore.getState().updateAnnotations(newImagePair);
        setImagePair(newImagePair);
        cloneImagePair.visibleImage.annotations = newAnnotations;
      }
      if (type === "infrared") {
        const newImagePair = {
          ...imagePair,
          infraredImage: {
            ...imagePair.infraredImage,
            annotations: newAnnotations,
          },
        };
        useStore.getState().updateAnnotations(newImagePair);
        setImagePair(newImagePair);
        cloneImagePair.infraredImage.annotations = newAnnotations;
      }
      
      // 准备要发送到后端的数据
      // 分离手动标注和自动标注
      const manualVisibleAnnotations = cloneImagePair.visibleImage.annotations.filter(
        a => !autoAnnotationIds.visible.includes(a.id)
      );
      
      const manualInfraredAnnotations = cloneImagePair.infraredImage.annotations.filter(
        a => !autoAnnotationIds.infrared.includes(a.id)
      );
      
      // 自动标注的数据
      const autoVisibleAnnotations = cloneImagePair.visibleImage.annotations.filter(
        a => autoAnnotationIds.visible.includes(a.id)
      );
      
      const autoInfraredAnnotations = cloneImagePair.infraredImage.annotations.filter(
        a => autoAnnotationIds.infrared.includes(a.id)
      );
      
      // 如果是修改或删除自动标注框，则需要更新YOLO标注数据
      if (isAutoAnnotationModified || isModifyingAutoAnnotations) {
        // 这里应该调用一个新的API来更新自动标注数据
        // 为简化实现，先复用manualAnnotations接口，但发送数据结构需要调整
        manualAnnotations({
          projectId: projectInfo.projectId,
          groupId: id,
          visibleImageId: imagePair.visibleImage.id,
          infraredImageId: imagePair.infraredImage.id,
          infraredImage: {
            annotations: manualInfraredAnnotations,
          },
          visibleImage: {
            annotations: manualVisibleAnnotations,
          },
          // 新增字段，表明这是对自动标注的修改
          yoloModifications: {
            visible: autoVisibleAnnotations,
            infrared: autoInfraredAnnotations
          },
          // 表明是对自动标注数据的修改
          isAutoAnnotationModified: true
        })
        .then((res) => {
          toast({
            title: "保存成功",
            status: "success",
            duration: 2000,
          });
        })
        .catch((err) => {
          toast({
            title: "保存失败",
            description: "请稍后重试",
            status: "error",
            duration: 2000,
          });
        });
      } else {
        // 如果只是修改手动标注数据，则使用原来的接口
        manualAnnotations({
          projectId: projectInfo.projectId,
          groupId: id,
          visibleImageId: imagePair.visibleImage.id,
          infraredImageId: imagePair.infraredImage.id,
          infraredImage: {
            annotations: manualInfraredAnnotations,
          },
          visibleImage: {
            annotations: manualVisibleAnnotations,
          },
        })
        .then((res) => {
          toast({
            title: "保存成功",
            status: "success",
            duration: 2000,
          });
        })
        .catch((err) => {
          toast({
            title: "保存失败",
            description: "请稍后重试",
            status: "error",
            duration: 2000,
          });
        });
      }
    } catch (error) {
      console.log("error :>> ", error);
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
    if (!(projectInfo.visibleImageId || projectInfo.infraredImageId)) return;

    const otherType = type === "visible" ? "infrared" : "visible";
    const otherImage =
      type === "visible" ? imagePair.infraredImage : imagePair.visibleImage;

    const newAnnotations: any[] = [...otherImage.annotations];
    const index = newAnnotations.findIndex((a) => a.id === annotation.id);

    if (index !== -1) {
      newAnnotations[index] = { ...annotation };
      handleAnnotationChange(newAnnotations, otherType);
    }
  };

  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框的键盘事件
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // 左箭头 - 上一组
      if (e.key === 'ArrowLeft' && prevGroupId && !loading) {
        handleNavigateToPrev();
      }
      
      // 右箭头 - 下一组
      if (e.key === 'ArrowRight' && nextGroupId && !loading) {
        handleNavigateToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prevGroupId, nextGroupId, loading, handleNavigateToPrev, handleNavigateToNext]);

  if (
    !projectInfo ||
    !(projectInfo.visibleImageId || projectInfo.infraredImageId)
  ) {
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
            onClick={() => navigate(`/projects/${projectInfo.projectId}`)}
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
        {/* <AutoAnnotateButton
          visibleImage={imagePair.visibleImage}
          infraredImage={imagePair.infraredImage}
          onAnnotationsChange={(annotations, type) =>
            handleAnnotationChange(annotations, type)
          }
        /> */}
      </VStack>

      {/* 中间双画布区域 */}
      <Flex flex="1" direction={"column"}>
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
              setImagePair={setImagePair}
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
              selectedId={
                selectedId?.type === "infrared" ? selectedId.id : null
              }
              setImagePair={setImagePair}
            />
          </Box>
        </Flex>
        <Box
          display={"absolute"}
          justifyContent={"center"}
          p={2}
          zIndex={999}
          left={0}
          bottom={0}
          height={100}
        >
          <Stack
            direction={["column", "row"]}
            spacing={2}
            flexWrap={"wrap"}
            overflowY={"auto"}
          >
            {presets.map((preset) => {
              return (
                <Tag
                  minW={8}
                  justifyContent={"center"}
                  cursor={"pointer"}
                  size="md"
                  variant="subtle"
                  bg={preset.color}
                  opacity={currentLabel?.id === preset.id ? 0.4 : 1}
                  _hover={{
                    opacity: 0.8,
                  }}
                  onClick={() =>
                    setCurrentLabel(
                      currentLabel?.id === preset.id ? null : preset
                    )
                  }
                  key={preset.id}
                >
                  <TagLabel>{preset.name}</TagLabel>
                </Tag>
              );
            })}
          </Stack>
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
          onAnnotationSelect={(id, type) => {
            setSelectedId({ id, type });
            setInternalSelectedId(id);
          }}
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
        
        {/* 图片组切换按钮 */}
        <Flex 
          position="absolute" 
          bottom="20px" 
          right="20px" 
          zIndex="100"
          gap={3}
          bg={colorMode === "dark" ? "gray.700" : "gray.100"}
          p={2}
          borderRadius="md"
          boxShadow="md"
          alignItems="center"
        >
          <Tooltip label="上一组" placement="top">
            <IconButton
              aria-label="上一组"
              icon={<FiArrowLeft />}
              colorScheme={prevGroupId ? "brand" : "gray"}
              onClick={handleNavigateToPrev}
              isDisabled={!prevGroupId || loading}
              size="md"
              variant={colorMode === "dark" ? "solid" : "outline"}
            />
          </Tooltip>
          
          {allGroupIds.length > 0 && (
            <Text fontSize="sm" fontWeight="medium" px={1}>
              {currentIndex + 1}/{allGroupIds.length}
            </Text>
          )}
          
          <Tooltip label="下一组" placement="top">
            <IconButton
              aria-label="下一组"
              icon={<FiArrowRight />}
              colorScheme={nextGroupId ? "brand" : "gray"}
              onClick={handleNavigateToNext}
              isDisabled={!nextGroupId || loading}
              size="md"
              variant={colorMode === "dark" ? "solid" : "outline"}
            />
          </Tooltip>
        </Flex>
      </Box>
    </Flex>
  );
};

export default AnnotationPage;
