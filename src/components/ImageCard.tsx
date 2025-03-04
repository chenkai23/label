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
import React from "react";

interface ImageCardProps {
  visibleImage: ImageType;
  infraredImage: ImageType;
}

const ImageCard = ({ visibleImage, infraredImage }: ImageCardProps) => {
  const { colorMode } = useColorMode();

  return (
    <Link to={`/annotation/${visibleImage.id}`}>
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
              src={visibleImage.url}
              alt={visibleImage.name}
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
              src={infraredImage.url}
              alt={infraredImage.name}
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
              {visibleImage.name}
            </Text>
            <HStack>
              <Badge colorScheme="blue">
                {visibleImage.annotations.length} 个可见光标注
              </Badge>
              <Badge colorScheme="red">
                {infraredImage.annotations.length} 个红外标注
              </Badge>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Link>
  );
};

export default ImageCard;
