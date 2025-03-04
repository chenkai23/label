import {
  Box,
  VStack,
  Text,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorMode,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tag,
} from "@chakra-ui/react";
import { Image } from "../types/project";
import React, { useMemo } from "react";
import { useStore } from "../store/index";

interface AnnotationStatsProps {
  visibleImage: Image;
  infraredImage: Image;
}

const AnnotationStats = ({
  visibleImage,
  infraredImage,
}: AnnotationStatsProps) => {
  const { colorMode } = useColorMode();
  const currentselectedBoxId = useStore((state) => state.currentselectedBoxId);
  // 统计可见光标注
  const visibleLabelCounts = visibleImage.annotations.reduce((acc, curr) => {
    console.log("visibleImage :>> ", visibleImage);
    acc[curr.label] = (acc[curr.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 统计红外标注
  const infraredLabelCounts = infraredImage.annotations.reduce((acc, curr) => {
    acc[curr.label] = (acc[curr.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 合并所有标签
  const allLabels = Array.from(
    new Set([
      ...Object.keys(visibleLabelCounts),
      ...Object.keys(infraredLabelCounts),
    ])
  ).filter(Boolean);

  const currentLabelinfo = useMemo(() => {
    let allImagesInfo = visibleImage.annotations.concat(
      infraredImage.annotations
    );
    let labelInfo = allImagesInfo.find(
      (item) => item.id === currentselectedBoxId
    );
    console.log("labelINfo :>> ", labelInfo);
    return labelInfo;
  }, [currentselectedBoxId]);

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>标注统计</Tab>
          <Tab>标注信息</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <StatGroup mb={6}>
              <Stat>
                <StatLabel>可见光标注</StatLabel>
                <StatNumber>{visibleImage.annotations.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>红外标注</StatLabel>
                <StatNumber>{infraredImage.annotations.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>标签种类</StatLabel>
                <StatNumber>{allLabels.length}</StatNumber>
              </Stat>
            </StatGroup>
            <VStack align="stretch" spacing={4}>
              <Tabs variant="enclosed">
                <TabList w={"100%"} overflowX={"auto"} overflowY={"hidden"}>
                  {allLabels.map((label, index) => {
                    return <Tab key={label + index}>{label || "未命名"}</Tab>;
                  })}
                </TabList>
                <TabPanels>
                  {allLabels.map((label, index) => {
                    return (
                      <TabPanel key={label + index}>
                        <VStack align="stretch" spacing={2}>
                          {/* 可见光标注统计 */}
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="gray.500">
                                可见光
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {visibleLabelCounts[label] || 0}
                              </Text>
                            </HStack>
                            <Progress
                              value={
                                ((visibleLabelCounts[label] || 0) /
                                  visibleImage.annotations.length) *
                                100
                              }
                              colorScheme="blue"
                              size="sm"
                              borderRadius="full"
                            />
                          </Box>

                          {/* 红外标注统计 */}
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="gray.500">
                                红外
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {infraredLabelCounts[label] || 0}
                              </Text>
                            </HStack>
                            <Progress
                              value={
                                ((infraredLabelCounts[label] || 0) /
                                  infraredImage.annotations.length) *
                                100
                              }
                              colorScheme="red"
                              size="sm"
                              borderRadius="full"
                            />
                          </Box>
                        </VStack>
                      </TabPanel>
                    );
                  })}
                </TabPanels>
              </Tabs>
              {allLabels.length === 0 && (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  暂无标注数据
                </Text>
              )}
            </VStack>
          </TabPanel>
          <TabPanel>
            {currentLabelinfo ? (
              <VStack align="stretch" spacing={4}>
                <Tag size="sm">X: {currentLabelinfo?.bbox[0]}</Tag>

                <Tag size="sm">Y: {currentLabelinfo?.bbox[1]}</Tag>
                <Tag size="sm">W: {currentLabelinfo?.bbox[2]}</Tag>
                <Tag size="sm">H: {currentLabelinfo?.bbox[3]}</Tag>
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                请选择标注框
              </Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* <Text fontSize="lg" fontWeight="bold" mb={4}>
        标注统计
      </Text> */}

      {/* <VStack align="stretch" spacing={4}>
        {allLabels.map((label) => (
          <Box key={label}>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              {label || "未命名"}
            </Text>
            <VStack align="stretch" spacing={2}>
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">
                    可见光
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {visibleLabelCounts[label] || 0}
                  </Text>
                </HStack>
                <Progress
                  value={
                    ((visibleLabelCounts[label] || 0) /
                      visibleImage.annotations.length) *
                    100
                  }
                  colorScheme="blue"
                  size="sm"
                  borderRadius="full"
                />
              </Box>

              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">
                    红外
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {infraredLabelCounts[label] || 0}
                  </Text>
                </HStack>
                <Progress
                  value={
                    ((infraredLabelCounts[label] || 0) /
                      infraredImage.annotations.length) *
                    100
                  }
                  colorScheme="red"
                  size="sm"
                  borderRadius="full"
                />
              </Box>
            </VStack>
          </Box>
        ))}
        {allLabels.length === 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            暂无标注数据
          </Text>
        )}
      </VStack> */}
    </Box>
  );
};

export default AnnotationStats;
