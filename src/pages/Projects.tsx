import {
  Container,
  Grid,
  Button,
  VStack,
  useDisclosure,
  Text,
  useToast,
  HStack,
  Box,
  IconButton,
  Tooltip,
  Badge,
} from "@chakra-ui/react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useStore } from "../store";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { deleteProject, getAllProjects } from "../services/http";
import { Alert } from "../components/Alert";

const Projects = () => {
  const {
    isOpen: createIsOpen,
    onOpen: createOnOpen,
    onClose: createOnClose,
  } = useDisclosure();
  
  const projects = useStore((state) => state.projects);
  const [projectList, setProjectList] = useState<any[]>([]);
  const toast = useToast();
  
  // 批量选择相关状态
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const {
    isOpen: isBatchDeleteAlertOpen,
    onOpen: onBatchDeleteAlertOpen,
    onClose: onBatchDeleteAlertClose,
  } = useDisclosure();

  const handleClose = useCallback(() => {
    createOnClose();
    getAllProjects().then((allProjects) => {
      if (allProjects?.projects && allProjects.projects.length) {
        setProjectList([...(allProjects.projects as [])]);
      }
    });
  }, [createOnClose, projectList]);

  const getData = useCallback(() => {
    getAllProjects().then((allProjects) => {
      setProjectList(allProjects?.projects || []);
      // 重置选择状态
      setSelectedProjects([]);
    });
  }, []);

  useEffect(() => {
    getData();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject({ projectId });
      
      toast({
        title: "删除成功",
        description: "项目已删除",
        status: "success",
        duration: 3000,
      });
      
      // 重新获取项目列表
      getData();
      
      return Promise.resolve();
    } catch (err: any) {
      toast({
        title: "删除失败",
        description: err.message,
        status: "error",
        duration: 3000,
      });
      
      return Promise.reject(err);
    }
  };
  
  // 处理项目选择状态变更
  const handleProjectSelect = useCallback((projectId: string, isSelected: boolean) => {
    setSelectedProjects(prev => {
      if (isSelected) {
        return [...prev, projectId];
      } else {
        return prev.filter(id => id !== projectId);
      }
    });
  }, []);
  
  // 切换批量操作模式
  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(prev => !prev);
    if (isBatchMode) {
      // 退出批量模式时，清空选择
      setSelectedProjects([]);
    }
  }, [isBatchMode]);
  
  // 全选所有项目
  const selectAllProjects = useCallback(() => {
    setSelectedProjects(projectList.map(project => project.id));
  }, [projectList]);
  
  // 取消所有选择
  const clearSelection = useCallback(() => {
    setSelectedProjects([]);
  }, []);
  
  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedProjects.length === 0) return;
    
    setIsBatchDeleting(true);
    try {
      // 串行删除，确保每个都成功
      for (const projectId of selectedProjects) {
        await deleteProject({ projectId });
      }
      
      toast({
        title: "批量删除成功",
        description: `已删除${selectedProjects.length}个项目`,
        status: "success",
        duration: 3000,
      });
      
      // 重置选择状态
      setSelectedProjects([]);
      
      // 重新获取项目列表
      getData();
    } catch (err) {
      toast({
        title: "批量删除失败",
        description: "部分项目可能未成功删除",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsBatchDeleting(false);
      onBatchDeleteAlertClose();
    }
  }, [selectedProjects, toast, getData, onBatchDeleteAlertClose]);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          {isBatchMode ? (
            <HStack>
              {selectedProjects.length > 0 && (
                <Badge colorScheme="brand" px={3} py={1} borderRadius="full">
                  已选择 {selectedProjects.length} 个项目
                </Badge>
              )}
              <Button 
                size="sm" 
                onClick={selectAllProjects}
                variant="outline"
                colorScheme="brand"
              >
                全选
              </Button>
              {selectedProjects.length > 0 && (
                <Button 
                  size="sm" 
                  onClick={clearSelection}
                  variant="outline"
                >
                  取消选择
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={toggleBatchMode}
                variant="outline"
              >
                退出批量操作
              </Button>
            </HStack>
          ) : (
            <Button 
              size="sm" 
              onClick={toggleBatchMode}
              variant="outline"
              colorScheme="brand"
            >
              批量操作
            </Button>
          )}
          
          <HStack>
            {isBatchMode && selectedProjects.length > 0 && (
              <Tooltip label="批量删除">
                <IconButton
                  icon={<FiTrash2 />}
                  aria-label="批量删除"
                  colorScheme="red"
                  onClick={onBatchDeleteAlertOpen}
                  size="sm"
                />
              </Tooltip>
            )}
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              onClick={createOnOpen}
            >
              创建项目
            </Button>
          </HStack>
        </HStack>

        {projectList.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            暂无项目，点击上方按钮创建新项目
          </Text>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {projectList.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => handleDeleteProject(project.id)}
                showCheckbox={isBatchMode}
                isSelected={selectedProjects.includes(project.id)}
                onSelect={handleProjectSelect}
              />
            ))}
          </Grid>
        )}
      </VStack>

      <CreateProjectModal isOpen={createIsOpen} onClose={handleClose} />
      
      <Alert
        isOpen={isBatchDeleteAlertOpen}
        onClose={onBatchDeleteAlertClose}
        text={`确定要批量删除${selectedProjects.length}个项目吗？此操作将删除所有相关数据且无法恢复。`}
        submit={handleBatchDelete}
        isLoading={isBatchDeleting}
      />
    </Container>
  );
};

export default Projects;
