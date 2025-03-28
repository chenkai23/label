import {
  Box,
  VStack,
  Text,
  Badge,
  useColorMode,
  HStack,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Project } from "../types/project";
import React, { useState } from "react";
import { CloseIcon } from "@chakra-ui/icons";
import { Alert } from "./Alert";

interface ProjectCardProps {
  project: Project;
  onDelete?: () => Promise<void>;
}

const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
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

  return (
    <>
      <Link to={`/projects/${project.id}`}>
        <Box
          p={4}
          borderRadius="lg"
          bg={colorMode === "dark" ? "gray.700" : "white"}
          boxShadow="sm"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "md",
          }}
          transition="all 0.2s"
          position={"relative"}
        >
          <IconButton
            isRound={true}
            variant="outline"
            colorScheme="red"
            aria-label="删除项目"
            fontSize="20px"
            icon={<CloseIcon w={"10px"} />}
            position={"absolute"}
            top={2}
            right={2}
            size={"sm"}
            onClick={handleDeleteClick}
          />
          <VStack align="stretch" spacing={2}>
            <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
              {project.name}
            </Text>
            <Text fontSize="sm" color="gray.500" noOfLines={2} h={5}>
              {project.description}
            </Text>
            <HStack>
              <Badge colorScheme="blue">{project.imageCount} 张图片</Badge>
              <Text fontSize="xs" color="gray.500">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Link>
      <Alert
        isOpen={isDeleteAlertOpen}
        onClose={onDeleteAlertClose}
        text="确定要删除这个项目吗？删除后无法恢复。"
        submit={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProjectCard;
