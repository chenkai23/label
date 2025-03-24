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
    downloadFile({ projectId: id }, exportAnnotations, "导出文件", "zip")
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
            {projectInfo?.imageGroups.map((pair) => (
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
