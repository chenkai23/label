import {
  Box,
  Image,
  Text,
  Badge,
  VStack,
  useColorMode,
  Grid,
  HStack,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Image as ImageType } from "../types/project";
import React, { useEffect, useState } from "react";
import { getImage } from "../services/http";
import { byteToImage } from "../utils/common";
import { FiTrash2 } from "react-icons/fi";
import { Alert } from "./Alert";

// 辅助函数：确保只显示文件名，不包含路径
const getFileName = (path: string): string => {
  if (!path) return '';
  // 使用正则表达式或split提取文件名
  const parts = path.split('/');
  return parts[parts.length - 1];
};

interface ImageCardProps {
  // visibleImage: ImageType;
  // infraredImage: ImageType;
  groupId: string;
  visibleImageId: string;
  infraredImageId: string;
  visibleNum: number;
  infraredNum: number;
  visibleImageName: string;
  originalName?: string;
  onDelete?: () => Promise<void>;
}

const ImageCard = ({
  groupId,
  visibleImageId,
  infraredImageId,
  visibleNum,
  infraredNum,
  visibleImageName,
  originalName,
  onDelete
}: ImageCardProps) => {
  const { colorMode } = useColorMode();
  const [visibleImage, setVisibleImage] = React.useState<any>(null);
  const [infraredImage, setInfraredImage] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();

  useEffect(() => {
    getImage({
      id: visibleImageId,
    }).then((res) => {
      setVisibleImage(byteToImage(res.data));
    });
    getImage({
      id: infraredImageId,
    }).then((res) => {
      setInfraredImage(byteToImage(res.data));
    });
  }, []);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认的链接跳转行为
    e.stopPropagation(); // 阻止事件冒泡
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
      <Link to={`/annotation/${groupId}`}>
        <Box
          borderRadius="lg"
          overflow="hidden"
          bg={colorMode === "dark" ? "gray.700" : "white"}
          boxShadow="sm"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "md",
          }}
          transition="all 0.2s"
          position="relative"
          role="group"
        >
          <IconButton
            aria-label="删除图片组"
            icon={<FiTrash2 />}
            size="sm"
            colorScheme="red"
            variant="solid"
            position="absolute"
            top={2}
            right={2}
            zIndex={2}
            opacity={0}
            _groupHover={{ opacity: 1 }}
            onClick={handleDeleteClick}
          />
          <Grid templateColumns="repeat(2, 1fr)" gap={2} p={2}>
            <Box>
              <Image
                src={visibleImage}
                // alt={visibleImage.name}
                w="100%"
                h="150px"
                objectFit="cover"
                borderRadius="md"
              />
              <Text fontSize="xs" p={1} color="gray.500" textAlign="center">
                可见光
              </Text>
            </Box>
            <Box>
              <Image
                src={infraredImage}
                // alt={infraredImage}
                w="100%"
                h="150px"
                objectFit="cover"
                borderRadius="md"
              />
              <Text fontSize="xs" p={1} color="gray.500" textAlign="center">
                红外
              </Text>
            </Box>
          </Grid>
          <Box p={3}>
            <VStack align="stretch" spacing={1}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {originalName ? getFileName(originalName) : getFileName(visibleImageName)}
              </Text>
              <HStack>
                <Badge colorScheme="blue">{visibleNum} 个可见光标注</Badge>
                <Badge colorScheme="red">{infraredNum} 个红外标注</Badge>
              </HStack>
            </VStack>
          </Box>
        </Box>
      </Link>
      <Alert
        isOpen={isDeleteAlertOpen}
        onClose={onDeleteAlertClose}
        text="确定要删除这个图片组吗？"
        submit={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ImageCard;
