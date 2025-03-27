import {
  Box,
  Container,
  Grid,
  Heading,
  HStack,
  Button,
  useColorMode,
  Text,
  useDisclosure,
  VStack,
  useToast,
  Select,
  Flex,
} from "@chakra-ui/react";
import { FiUpload, FiDownload } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { useStore } from "../store";
import ImageCard from "../components/ImageCard";
import UploadModal from "../components/UploadModal";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import UploadFolderModal from "../components/UploadFolderModal";
import { exportAnnotations, getProjectInfo, deleteImageGroup } from "../services/http";
import AutoAnnotateButton from "../components/AutoAnnotateButton";
import { downloadFile } from "../utils/common";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { colorMode } = useColorMode();
  const {
    isOpen: isUploadModalOpen,
    onOpen: onUploadModalOpen,
    onClose: onUploadModalClose,
  } = useDisclosure();
  const {
    isOpen: isUploadFolderModalOpen,
    onOpen: onUploadFolderModalOpen,
    onClose: onUploadFolderModalClose,
  } = useDisclosure();
  // const project = useStore((state) => state.projects.find((p) => p.id === id));
  const [projectInfo, setProjectInfo] = useState<any>();
  const [isExporting, setIsExporting] = useState(false);
  const [sortOption, setSortOption] = useState<string>("uploadTime_desc");
  const toast = useToast();

  const refreshProjectInfo = useCallback(() => {
    if (!id) return;
    getProjectInfo({
      projectId: id,
    }).then((res) => {
      if (res) {
        setProjectInfo(res);
      }
    });
  }, [id]);

  useEffect(() => {
    refreshProjectInfo();
  }, [refreshProjectInfo]);

  // if (!project) {
  //   return <Container>项目不存在</Container>;
  // }

  const handleClose = useCallback(() => {
    onUploadFolderModalClose();
    getProjectInfo({
      projectId: id,
    }).then((res) => {
      if (res) {
        setProjectInfo(res);
      }
    });
  }, [onUploadFolderModalClose]);

  const handleExport = async () => {
    setIsExporting(true);
    // try {
    //   toast({
    //     title: "导出成功",
    //     status: "success",
    //     duration: 2000,
    //   });
    // } catch (error) {
    //   toast({
    //     title: "导出失败",
    //     description: "请稍后重试",
    //     status: "error",
    //     duration: 2000,
    //   });
    // } finally {
    //   setIsExporting(false);
    // }
    
    // 获取并处理项目名称为安全的文件名
    const fileName = projectInfo?.name 
      ? `${projectInfo.name}_标注数据` 
      : "标注数据";
    
    downloadFile({ projectId: id }, exportAnnotations, fileName, "zip")
      .then((res) => {
        toast({
          title: "导出成功",
          status: "success",
          duration: 2000,
        });
      })
      .catch((err) => {
        toast({
          title: "导出失败",
          description: "请稍后重试",
          status: "error",
          duration: 2000,
        });
      })
      .finally(() => {
        setIsExporting(false);
      });
  };

  const handleImageGroupDelete = async (groupId: string) => {
    try {
      const result = await deleteImageGroup({ groupId });
      if (result.status === 'success') {
        toast({
          title: '删除成功',
          status: 'success',
          duration: 2000,
        });
        // 刷新项目信息，更新图片组列表
        refreshProjectInfo();
      } else {
        toast({
          title: '删除失败',
          description: '请稍后重试',
          status: 'error',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleUploadModalClose = useCallback(() => {
    onUploadModalClose();
    refreshProjectInfo();
  }, [onUploadModalClose, refreshProjectInfo]);

  const getSortedImageGroups = useCallback(() => {
    if (!projectInfo?.imageGroups) return [];
    
    const imageGroups = [...projectInfo.imageGroups];
    
    switch (sortOption) {
      case "uploadTime_asc":
        // 按ID升序排序（假设ID越小表示上传时间越早）
        return imageGroups.sort((a, b) => a.id - b.id);
      case "uploadTime_desc":
        // 按ID降序排序（假设ID越大表示上传时间越晚）
        return imageGroups.sort((a, b) => b.id - a.id);
      case "name_asc":
        // 按图片组名字升序排序
        return imageGroups.sort((a, b) => {
          const nameA = a.originalName || "";
          const nameB = b.originalName || "";
          return nameA.localeCompare(nameB);
        });
      case "name_desc":
        // 按图片组名字降序排序
        return imageGroups.sort((a, b) => {
          const nameA = a.originalName || "";
          const nameB = b.originalName || "";
          return nameB.localeCompare(nameA);
        });
      default:
        return imageGroups;
    }
  }, [projectInfo, sortOption]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">{projectInfo?.name}</Heading>
          <HStack spacing={4}>
            <Button
              leftIcon={<FiUpload />}
              colorScheme="brand"
              onClick={onUploadModalOpen}
            >
              上传图片
            </Button>
            <Button
              leftIcon={<FiUpload />}
              colorScheme="brand"
              onClick={onUploadFolderModalOpen}
            >
              上传文件夹
            </Button>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              onClick={handleExport}
              isLoading={isExporting}
            >
              导出标注
            </Button>
            <AutoAnnotateButton
              imageInfoArr={projectInfo?.imageGroups}
              onAnnotationsChange={() => {
                getProjectInfo({
                  projectId: id,
                }).then((res) => {
                  if (res) {
                    setProjectInfo(res);
                  }
                });
              }}
              // onAnnotationsChange={(annotations, type) =>
              //   handleAnnotationChange(annotations, type)
              // }
            />
          </HStack>
        </HStack>

        <Flex justify="flex-end" mb={4}>
          <Select 
            width="250px" 
            value={sortOption} 
            onChange={handleSortChange}
            bg={colorMode === "dark" ? "gray.700" : "white"}
          >
            <option value="uploadTime_desc">上传时间（最新优先）</option>
            <option value="uploadTime_asc">上传时间（最早优先）</option>
            <option value="name_asc">图片组名称（A-Z）</option>
            <option value="name_desc">图片组名称（Z-A）</option>
          </Select>
        </Flex>

        {!projectInfo?.imageGroups || projectInfo?.imageGroups.length === 0 ? (
          <Box
            p={8}
            textAlign="center"
            borderRadius="lg"
            bg={colorMode === "dark" ? "gray.700" : "gray.50"}
          >
            <Text color="gray.500">还没有上传图片，点击"上传图片"开始添加</Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {getSortedImageGroups().map((pair) => (
              <ImageCard
                key={pair.id}
                groupId={pair.id}
                visibleImageId={pair.visibleImageId}
                infraredImageId={pair.infraredImageId}
                visibleNum={pair.visibleNum}
                infraredNum={pair.infraredNum}
                visibleImageName={pair.visibleImageName}
                originalName={pair.originalName}
                onDelete={() => handleImageGroupDelete(pair.id)}
              />
            ))}
          </Grid>
        )}
        {/* {!project.imagePairs || project.imagePairs.length === 0 ? (
          <Box
            p={8}
            textAlign="center"
            borderRadius="lg"
            bg={colorMode === "dark" ? "gray.700" : "gray.50"}
          >
            <Text color="gray.500">还没有上传图片，点击"上传图片"开始添加</Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {project.imagePairs.map((pair) => (
              <ImageCard
                key={pair.id}
                visibleImage={pair.visibleImage}
                infraredImage={pair.infraredImage}
              />
            ))}
          </Grid>
        )} */}
      </VStack>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        projectId={projectInfo?.id}
        onSuccess={refreshProjectInfo}
      />
      <UploadFolderModal
        id={id}
        isOpen={isUploadFolderModalOpen}
        onClose={handleClose}
        // projectId={project.id}
      />
    </Container>
  );
};

export default ProjectDetail;
