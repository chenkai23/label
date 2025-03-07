import {
  Box,
  Image,
  Text,
  Badge,
  VStack,
  useColorMode,
  Grid,
  HStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Image as ImageType } from "../types/project";
import React, { useEffect } from "react";
import { getImage } from "../services/http";
import { byteToImage } from "../utils/common";

interface ImageCardProps {
  // visibleImage: ImageType;
  // infraredImage: ImageType;
  groupId: string;
  visibleImageId: string;
  infraredImageId: string;
  visibleNum: number;
  infraredNum: number;
  visibleImageName: string;
}

const ImageCard = ({
  groupId,
  visibleImageId,
  infraredImageId,
  visibleNum,
  infraredNum,
  visibleImageName,
}: ImageCardProps) => {
  const { colorMode } = useColorMode();
  const [visibleImage, setVisibleImage] = React.useState<any>(null);
  const [infraredImage, setInfraredImage] = React.useState<any>(null);
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

  return (
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
      >
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
              {visibleImageName}
            </Text>
            <HStack>
              <Badge colorScheme="blue">{visibleNum} 个可见光标注</Badge>
              <Badge colorScheme="red">{infraredNum} 个红外标注</Badge>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Link>
  );
};

export default ImageCard;
