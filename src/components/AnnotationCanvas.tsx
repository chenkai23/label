import { Box, useColorMode, Text, useToast } from "@chakra-ui/react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
} from "react-konva";
import { useEffect, useRef, useState, useCallback } from "react";
import { Image as ImageType, Annotation } from "../types/project";
import { memo } from "react";
import { useStore } from "../store/index";
import { getLabelColor } from "../utils/colors";
import React from "react";
import { getImage } from "../services/http";
import { byteToImage } from "../utils/common";

interface AnnotationCanvasProps {
  image: ImageType;
  scale: number;
  tool?: string;
  setTool?: (tool: string) => void;
  selectedId?: string | null;
  onAnnotationChange?: (annotations: Annotation[]) => void;
  syncAnnotation?: (annotation: Annotation) => void;
  setImagePair: Function;
  onDelete: Function;
}

function convertToRGBA(color, alpha) {
  // 提取 RGB 值
  const rgbValues = color.match(/\d+/g);
  if (!rgbValues || rgbValues.length !== 3) {
    throw new Error("Invalid RGB color format");
  }

  // 返回 RGBA 字符串
  return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`;
}

const AnnotationRect = memo(
  ({
    annotation,
    isSelected,
    onSelect,
    onChange,
    onDragMove,
    ...props
  }: any) => {
    const shapeRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const { colorMode } = useColorMode();

    useEffect(() => {
      if (isSelected && transformerRef.current) {
        transformerRef.current.nodes([shapeRef.current]);
        transformerRef.current.getLayer().batchDraw();
      }
    }, [isSelected]);

    // 获取标签对应的颜色
    const color = annotation.color;

    return (
      <>
        <Rect
          ref={shapeRef}
          x={annotation.bbox[0]}
          y={annotation.bbox[1]}
          width={annotation.bbox[2]}
          height={annotation.bbox[3]}
          onClick={() => {
            onSelect(annotation.id);
          }}
          onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...annotation,
              bbox: [
                node.x(),
                node.y(),
                Math.abs(node.width() * scaleX),
                Math.abs(node.height() * scaleY),
              ],
            });
          }}
          onDragEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...annotation,
              bbox: [
                node.x(),
                node.y(),
                Math.abs(node.width() * scaleX),
                Math.abs(node.height() * scaleY),
              ],
            });
          }}
          onDragMove={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onDragMove(
              {
                ...annotation,
                bbox: [
                  node.x(),
                  node.y(),
                  Math.abs(node.width() * scaleX),
                  Math.abs(node.height() * scaleY),
                ],
              },
              node
            );
          }}
          stroke={color} // 边框颜色
          strokeWidth={isSelected ? 4 : 3} // 增加线宽
          dash={[]} // 移除虚线效果
          draggable={props.draggable}
          fill={convertToRGBA(color, 0.25)} // 填充颜色
          opacity={0.7} // 降低填充透明度
          {...props}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef}
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) => {
              const minSize = 5;
              if (newBox.width < minSize || newBox.height < minSize) {
                return oldBox;
              }
              return newBox;
            }}
            borderStroke={color} // 变换框的边框颜色
            borderStrokeWidth={2} // 变换框的线宽
            anchorFill={color} // 锚点填充颜色
            anchorStroke={color} // 锚点边框颜色
            anchorSize={8} // 增大锚点大小
          />
        )}
      </>
    );
  }
);

const AnnotationCanvas = ({
  image,
  scale,
  tool = "move",
  setTool,
  selectedId: externalSelectedId,
  onAnnotationChange,
  syncAnnotation,
  setImagePair,
  onDelete,
}: AnnotationCanvasProps) => {
  const stageRef = useRef<any>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  // const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
  //   null
  // );
  const internalSelectedId = useStore((state) => state.currentselectedBoxId);
  const setInternalSelectedId = useStore(
    (state) => state.setCurrentselectedBoxId
  );
  // const selectedId = externalSelectedId ?? internalSelectedId;
  const selectedId = internalSelectedId;
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const { colorMode } = useColorMode();
  const currentLabel = useStore((state) => state.currentLabel);
  const toast = useToast();
  const labelPresets = useStore((state) => state.labelPresets);
  const setCurrentLabel = useStore((state) => state.setCurrentLabel);

  const loadingHeight = useRef<any>();
  useEffect(() => {
    setInternalSelectedId(null);
  }, []);
  // 加载图片
  useEffect(() => {
    if (!image?.url) return;
    getImage({
      id: image.id,
    }).then((res) => {
      const blob = new Blob([res.data], { type: "image/jpeg" }); // 根据实际情况调整 MIME 类型
      const reader = new FileReader();
      reader.onload = function (event) {
        // 创建 Image 对象
        const img: any = new Image();
        img.crossOrigin = "anonymous";
        // 将 dataURL 赋值给 Image 对象的 src 属性
        img.src = event.target!.result;

        // 图片加载完成后传递给 Konva.Image
        img.onload = function () {
          setImageObj(img);
        };
      };
      if (blob) {
        reader.readAsDataURL(blob);
      }
    });
  }, [image?.url]);

  // 同步标注数据
  useEffect(() => {
    if (image?.annotations) {
      setAnnotations(image.annotations);
    }
  }, [image?.annotations]);

  // 计算画布尺寸
  const getCanvasDimensions = useCallback(() => {
    const containerWidth = (window.innerWidth - 364) / 2;
    const containerHeight = window.innerHeight - 64;
    return { width: containerWidth, height: containerHeight };
  }, []);

  // 计算图片变换
  const getImageTransform = useCallback(() => {
    if (!imageObj) return { width: 0, height: 0, x: 0, y: 0, scale: 1 };

    const { width: containerWidth, height: containerHeight } =
      getCanvasDimensions();
    const imageRatio = imageObj.width / imageObj.height;
    const containerRatio = containerWidth / containerHeight;

    let width, height, x, y, imageScale;
    if (imageRatio > containerRatio) {
      imageScale = containerWidth / imageObj.width;
      width = containerWidth;
      height = imageObj.height * imageScale;
      x = 0;
      y = (containerHeight - height) / 2;
    } else {
      imageScale = containerHeight / imageObj.height;
      height = containerHeight;
      width = imageObj.width * imageScale;
      x = (containerWidth - width) / 2;
      y = 0;
    }

    return { width, height, x, y, scale: imageScale };
  }, [imageObj, getCanvasDimensions]);

  // 更新标注
  const updateAnnotations = useCallback(
    (newAnnotations: Annotation[]) => {
      setAnnotations(newAnnotations);
      onAnnotationChange?.(newAnnotations);
    },
    [onAnnotationChange]
  );

  // 判断点击是否在图片区域内
  const isPointInImage = useCallback(
    (point: { x: number; y: number }) => {
      const transform = getImageTransform();
      return (
        point.x >= transform.x &&
        point.x <= transform.x + transform.width &&
        point.y >= transform.y &&
        point.y <= transform.y + transform.height
      );
    },
    [getImageTransform]
  );

  // 修改鼠标按下事件处理
  const handleMouseDown = useCallback(
    (e: any) => {
      if (tool !== "rectangle") return;
      if (!currentLabel) {
        toast({
          title: "请先选择标签",
          status: "warning",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      const transform = getImageTransform();

      // 检查点击是否在图片区域内
      if (!isPointInImage(pos)) return;

      // 修改坐标转换逻辑
      const pointInImage = {
        x: (pos.x - transform.x) / transform.scale,
        y: (pos.y - transform.y) / transform.scale,
      };

      setIsDrawing(true);
      setStartPos(pointInImage);

      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        bbox: [pointInImage.x, pointInImage.y, 0, 0],
        label: currentLabel.name,
        color: currentLabel.color,
      };
      setAnnotations([...annotations, newAnnotation]);
    },
    [tool, annotations, getImageTransform, isPointInImage, currentLabel, toast]
  );

  // 处理鼠标移动
  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing) return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      const transform = getImageTransform();

      const pointInImage = {
        x: (pos.x - transform.x) / transform.scale,
        y: (pos.y - transform.y) / transform.scale,
      };

      const newAnnotations = annotations.map((ann, i) => {
        if (i === annotations.length - 1) {
          return {
            ...ann,
            bbox: [
              Math.min(startPos.x, pointInImage.x),
              Math.min(startPos.y, pointInImage.y),
              Math.abs(pointInImage.x - startPos.x),
              Math.abs(pointInImage.y - startPos.y),
            ],
          };
        }
        return ann;
      });
      setAnnotations(newAnnotations);
    },
    [isDrawing, startPos, annotations, getImageTransform]
  );

  // 修改鼠标松开事件处理
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    const lastAnnotation = annotations[annotations.length - 1];
    // 只有当框的宽度和高度都大于最小值时才保存
    if (
      lastAnnotation &&
      lastAnnotation.bbox[2] > 5 / getImageTransform().scale &&
      lastAnnotation.bbox[3] > 5 / getImageTransform().scale
    ) {
      updateAnnotations(annotations);
    } else {
      // 如果框太小，则移除这个标注
      setAnnotations(annotations.slice(0, -1));
    }
    setIsDrawing(false);
  }, [isDrawing, annotations, updateAnnotations, getImageTransform]);

  // 修改快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 如果正在输入，则不处理快捷键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // 检查是否按下 Ctrl/Command 键
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === "z") {
        // 撤销操作
        e.preventDefault(); // 阻止浏览器默认的撤销行为
        useStore.getState().undoAnnotation(setImagePair);
        return;
      }

      // 其他快捷键处理保持不变
      switch (e.key.toLowerCase()) {
        case "v":
          if (tool !== "move") {
            setTool?.("move");
          }
          break;
        case "r":
          if (tool !== "rectangle") {
            setTool?.("rectangle");
          }
          break;
        case "escape":
          setInternalSelectedId(null);
          break;
        case "delete":
          const newAnnotations = annotations.filter((a) => a.id === selectedId);
          newAnnotations.forEach((annotations) => {
            onDelete(selectedId, annotations.id.split("_")[0]);
          });
          break;
        case "backspace":
          if (selectedId) {
            const newAnnotations = annotations.filter(
              (a) => a.id !== selectedId
            );
            updateAnnotations(newAnnotations);
            setInternalSelectedId(null);
          }
          break;
        default:
          const preset = labelPresets.find(
            (p) => p.shortcut?.toLowerCase() === e.key.toLowerCase()
          );
          if (preset) {
            setCurrentLabel(currentLabel?.id === preset.id ? null : preset);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    tool,
    setTool,
    selectedId,
    annotations,
    updateAnnotations,
    labelPresets,
    currentLabel,
    setCurrentLabel,
  ]);

  const drawBox = (
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    isSelected: boolean
  ) => {
    const [x, y, width, height] = annotation.bbox;
    const scaledX = x * scale;
    const scaledY = y * scale;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // 获取标签对应的颜色
    const color = getLabelColor(annotation.label);

    // 设置框的样式
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;

    // 绘制框
    ctx.beginPath();
    ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
    ctx.stroke();

    // 绘制标签背景
    const label = `${annotation.label} ${(
      annotation?.confidence! * 100
    ).toFixed(0)}%`;
    const labelWidth = ctx.measureText(label).width + 4;
    const labelHeight = 20;

    ctx.fillStyle = color;
    ctx.fillRect(scaledX, scaledY - labelHeight, labelWidth, labelHeight);

    // 绘制标签文本
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.fillText(label, scaledX + 2, scaledY - 6);
  };

  if (!image) {
    return (
      <Box
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        ref={loadingHeight}
      >
        <Text>无图片数据</Text>
      </Box>
    );
  }

  if (!imageObj) {
    return (
      <Box
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        ref={loadingHeight}
      >
        <Text>图片加载中...</Text>
      </Box>
    );
  }

  const dimensions = getCanvasDimensions();
  const imageTransform = getImageTransform();

  return (
    <Box width="100%" height="100%" overflow="hidden">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height - 150}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            setInternalSelectedId(null);
          }
        }}
        scale={{ x: scale, y: scale }}
      >
        <Layer>
          <KonvaImage
            image={imageObj}
            width={imageTransform.width}
            height={imageTransform.height}
            x={imageTransform.x}
            y={imageTransform.y}
          />
          {annotations.map((annotation) => (
            <AnnotationRect
              key={annotation.id}
              annotation={
                annotation.bbox[1] * imageTransform.scale + imageTransform.y > 0
                  ? {
                      ...annotation,
                      bbox: [
                        annotation.bbox[0] * imageTransform.scale +
                          imageTransform.x,
                        annotation.bbox[1] * imageTransform.scale +
                          imageTransform.y,
                        annotation.bbox[2] * imageTransform.scale,
                        annotation.bbox[3] * imageTransform.scale,
                      ],
                    }
                  : {
                      ...annotation,
                      bbox: [
                        annotation.bbox[0] * imageTransform.scale +
                          imageTransform.x,
                        0,
                        annotation.bbox[2] * imageTransform.scale,
                        annotation.bbox[3] * imageTransform.scale,
                      ],
                    }
              }
              isSelected={selectedId === annotation.id}
              onSelect={setInternalSelectedId}
              onChange={(changed) => {
                if (
                  (changed.bbox[1] - imageTransform.y) / imageTransform.scale <
                  0
                ) {
                  const originalAnnotation = {
                    ...changed,
                    bbox: [
                      (changed.bbox[0] - imageTransform.x) /
                        imageTransform.scale,
                      0,
                      changed.bbox[2] / imageTransform.scale,
                      changed.bbox[3] / imageTransform.scale,
                    ],
                  };
                  const newAnnotations = annotations.map((a) =>
                    a.id === changed.id ? originalAnnotation : a
                  );
                  updateAnnotations(newAnnotations);
                  syncAnnotation?.(originalAnnotation);
                } else {
                  const originalAnnotation = {
                    ...changed,
                    bbox: [
                      (changed.bbox[0] - imageTransform.x) /
                        imageTransform.scale,
                      (changed.bbox[1] - imageTransform.y) /
                        imageTransform.scale,
                      changed.bbox[2] / imageTransform.scale,
                      changed.bbox[3] / imageTransform.scale,
                    ],
                  };
                  const newAnnotations = annotations.map((a) =>
                    a.id === changed.id ? originalAnnotation : a
                  );
                  updateAnnotations(newAnnotations);
                  syncAnnotation?.(originalAnnotation);
                }
              }}
              onDragMove={(changed, node) => {
                if (
                  (changed.bbox[1] - imageTransform.y) / imageTransform.scale <
                  0
                ) {
                  const originalAnnotation = {
                    ...changed,
                    bbox: [
                      (changed.bbox[0] - imageTransform.x) /
                        imageTransform.scale,
                      0,
                      changed.bbox[2] / imageTransform.scale,
                      changed.bbox[3] / imageTransform.scale,
                    ],
                  };
                  const newAnnotations = annotations.map((a) =>
                    a.id === changed.id ? originalAnnotation : a
                  );
                  setAnnotations(newAnnotations);
                  node.y(imageTransform.y);
                }
              }}
              draggable={tool === "move"}
            />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
};

export default memo(AnnotationCanvas);
