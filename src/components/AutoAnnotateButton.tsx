import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useToast,
  VStack,
  HStack,
  Text,
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightAddon,
} from "@chakra-ui/react";
import { FiCpu } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { autoAnnotate } from "../services/http";

interface AutoAnnotateButtonProps {
  imageInfoArr: {
    id: number;
    infraredImageId: string;
    infraredImageName: string;
    infraredNum: number;
    visibleImageId: string;
    visibleImageName: string;
    visibleNum: number;
  }[];
  onAnnotationsChange: () => void;
}

const AutoAnnotateButton = ({
  imageInfoArr,
  onAnnotationsChange,
}: AutoAnnotateButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [conf, setConf] = useState(0.5);
  const [iou, setIou] = useState(0.5);
  const [confInput, setConfInput] = useState("0.5");
  const [iouInput, setIouInput] = useState("0.5");
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    setConfInput(conf.toString());
  }, [conf]);

  useEffect(() => {
    setIouInput(iou.toString());
  }, [iou]);

  const handleConfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfInput(e.target.value);
  };

  const handleIouInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIouInput(e.target.value);
  };

  const handleConfBlur = () => {
    const value = parseFloat(confInput);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setConf(value);
    } else {
      setConfInput(conf.toString());
      toast({
        title: "无效的置信度值",
        description: "请输入0-1之间的数字",
        status: "warning",
        duration: 2000,
      });
    }
  };

  const handleIouBlur = () => {
    const value = parseFloat(iouInput);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setIou(value);
    } else {
      setIouInput(iou.toString());
      toast({
        title: "无效的IOU值",
        description: "请输入0-1之间的数字",
        status: "warning",
        duration: 2000,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'conf' | 'iou') => {
    if (e.key === 'Enter') {
      if (type === 'conf') {
        handleConfBlur();
      } else {
        handleIouBlur();
      }
    }
  };

  const handleAutoAnnotate = async () => {
    setIsLoading(true);
    try {
      let imageArr: { id: number; url: string; annotations: any[] }[] = [];
      imageArr = imageInfoArr.map((imageInfo) => ({
        id: imageInfo.id,
        url: "",
        annotations: [],
      }));
      let promises: Promise<any>[] = [];
      imageArr.forEach(async (image) => {
        promises.push(
          autoAnnotate({
            groupId: image.id,
            projectId: id,
            conf,
            iou,
          })
        );
      });
      Promise.all(promises)
        .then((res) => {
          onAnnotationsChange();
          toast({
            title: "自动标注完成",
            description: `${res.length}个照片组完成标注`,
            status: "success",
            duration: 2000,
          });
        })
        .catch((error) => {
          toast({
            title: "自动标注失败",
            description: "请稍后重试",
            status: "error",
            duration: 2000,
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      console.error("Auto annotation error:", error);
      toast({
        title: "自动标注失败",
        description: "请稍后重试",
        status: "error",
        duration: 2000,
      });
    }
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        w={20}
        leftIcon={<FiCpu />}
        isLoading={isLoading}
        loadingText="正在标注"
        variant="outline"
        size="sm"
        colorScheme="brand"
      >
        AI
      </MenuButton>
      <MenuList p={4} minW="280px">
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>置信度阈值</FormLabel>
            <HStack>
              <Slider 
                value={conf} 
                min={0} 
                max={1} 
                step={0.01}
                onChange={(v) => setConf(v)}
                flex="1"
                colorScheme="brand"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={6} />
              </Slider>
              <InputGroup size="sm" width="80px">
                <Input
                  value={confInput}
                  onChange={handleConfInputChange}
                  onBlur={handleConfBlur}
                  onKeyDown={(e) => handleKeyDown(e, 'conf')}
                  textAlign="right"
                />
              </InputGroup>
            </HStack>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>IOU阈值</FormLabel>
            <HStack>
              <Slider 
                value={iou} 
                min={0} 
                max={1} 
                step={0.01}
                onChange={(v) => setIou(v)}
                flex="1"
                colorScheme="brand"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={6} />
              </Slider>
              <InputGroup size="sm" width="80px">
                <Input
                  value={iouInput}
                  onChange={handleIouInputChange}
                  onBlur={handleIouBlur}
                  onKeyDown={(e) => handleKeyDown(e, 'iou')}
                  textAlign="right"
                />
              </InputGroup>
            </HStack>
          </FormControl>

          <Button
            colorScheme="brand"
            onClick={handleAutoAnnotate}
            isLoading={isLoading}
            loadingText="正在标注"
          >
            开始标注
          </Button>
        </VStack>
      </MenuList>
    </Menu>
  );
};

export default AutoAnnotateButton;
