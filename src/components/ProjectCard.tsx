import {
  Box,
  Text,
  Badge,
  HStack,
  useColorMode,
  VStack,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import React, { useState } from "react";
import { Alert } from "./Alert";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    imageCount: number;
    updatedAt: string;
  };
  onDelete?: () => Promise<void>;
  isSelected?: boolean;
  onSelect?: (id: string, isSelected: boolean) => void;
  showCheckbox?: boolean;
}

const ProjectCard = ({ 
  project, 
  onDelete, 
  isSelected = false, 
  onSelect,
  showCheckbox = false 
}: ProjectCardProps) => {
  const { colorMode } = useColorMode();
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteAlertOpen();
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
        onDeleteAlertClose();
      }
    }
  };
  
  const handleBoxClick = (e: React.MouseEvent) => {
    // 当处于批量操作模式时，点击卡片切换选中状态
    if (showCheckbox) {
      e.preventDefault();
      e.stopPropagation();
      if (onSelect) {
        onSelect(project.id, !isSelected);
      }
    }
  };

  return (
    <>
      <Link to={`/projects/${project.id}`}>
        <Box
          p={5}
          borderRadius="xl"
          bg={colorMode === "dark" ? "gray.700" : "white"}
          boxShadow="rgba(0, 0, 0, 0.05) 0px 1px 2px, rgba(0, 0, 0, 0.1) 0px 1px 3px"
          border="2px solid"
          borderColor={isSelected 
            ? "brand.500" 
            : colorMode === "dark" ? "gray.600" : "gray.100"}
          _hover={{
            transform: "translateY(-4px)",
            boxShadow: "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
            borderColor: isSelected 
              ? "brand.600" 
              : colorMode === "dark" ? "gray.500" : "gray.200"
          }}
          transition="all 0.3s ease"
          position="relative"
          role="group"
          onClick={handleBoxClick}
        >
          <IconButton
            aria-label="删除项目"
            icon={<FiTrash2 />}
            size="sm"
            colorScheme="red"
            variant="solid"
            position="absolute"
            top={3}
            right={3}
            zIndex={2}
            opacity={0}
            _groupHover={{ 
              opacity: 1,
              transform: "scale(1.05)"
            }}
            transition="all 0.2s ease"
            boxShadow="md"
            onClick={handleDeleteClick}
          />
          <VStack align="stretch" spacing={3} mt={1}>
            <Text fontSize="xl" fontWeight="bold" noOfLines={1} lineHeight="shorter">
              {project.name}
            </Text>
            <Text fontSize="sm" color={colorMode === "dark" ? "gray.400" : "gray.600"} noOfLines={2} minH="40px" lineHeight="1.4">
              {project.description || "暂无描述"}
            </Text>
            <HStack justifyContent="space-between" alignItems="center" mt={1}>
              <Badge colorScheme="blue" px={2} py={1} borderRadius="md" fontSize="xs">
                {project.imageCount} 组图片
              </Badge>
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                {new Date(project.updatedAt).toLocaleDateString()}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Link>
      <Alert
        isOpen={isDeleteAlertOpen}
        onClose={onDeleteAlertClose}
        text={`确定要删除项目"${project.name}"吗？此操作将删除所有相关数据且无法恢复。`}
        submit={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProjectCard;
