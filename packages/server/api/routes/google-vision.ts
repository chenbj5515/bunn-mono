// import { Hono } from 'hono'
// import { ContentfulStatusCode } from 'hono/utils/http-status'
// import { ImageAnnotatorClient } from '@google-cloud/vision'
// import vision from '@google-cloud/vision'

// // 错误码定义
// const ERROR_CODES = {
//     // 输入相关错误 (2000-2999)
//     INVALID_REQUEST_BODY: 2001,
//     MISSING_PARAMETERS: 2002,
//     MISSING_IMAGE: 2003,

//     // API相关错误 (4000-4999)
//     API_KEY_MISSING: 4001,
//     API_ERROR: 4002,
//     CREDENTIALS_MISSING: 4003,

//     // 服务器错误 (5000-5999)
//     INTERNAL_SERVER_ERROR: 5001
// };

// const app = new Hono()
//   .basePath('/ai/google-vision')
//   .post('/', async (c) => {
//     try {
//         // 处理 FormData 格式的请求
//         const formData = await c.req.formData();
//         const imageFile = formData.get('image') as File;
        
//         if (!imageFile) {
//             return c.json({
//                 success: false,
//                 error: '未找到图片文件',
//                 errorCode: ERROR_CODES.MISSING_IMAGE
//             }, 400 as ContentfulStatusCode);
//         }

//         // 将文件转换为 Buffer
//         const arrayBuffer = await imageFile.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);

//         // 检查是否设置了 GOOGLE_VISION_API_KEY 环境变量
//         if (!process.env.GOOGLE_VISION_API_KEY) {
//             console.warn('未设置 GOOGLE_VISION_API_KEY 环境变量');
//             return c.json({
//                 success: false,
//                 error: '未配置Google Cloud API密钥，请在环境变量中设置GOOGLE_VISION_API_KEY',
//                 errorCode: ERROR_CODES.API_KEY_MISSING,
//                 setupGuide: '请在Google Cloud Console创建API密钥',
//             }, 500 as ContentfulStatusCode);
//         }

//         // 创建 Vision API 客户端实例，直接使用API密钥
//         const client = new vision.ImageAnnotatorClient({
//             keyFilename: undefined, // 不使用keyFilename
//             apiKey: process.env.GOOGLE_VISION_API_KEY // 直接使用API密钥
//         });
        
//         // 图像内容
//         const image = {
//             content: buffer
//         };
        
//         // 设置图像特性（只进行文本检测）
//         const features = [
//             { type: 'TEXT_DETECTION' }
//         ];
        
//         // 发起请求
//         const [result] = await client.annotateImage({
//             image,
//             features,
//         });

//         // 提取结果
//         const textAnnotations = result.textAnnotations || [];
//         const fullText = textAnnotations[0]?.description ?? '';
        
//         // 单独的文本实体（单词或短语）
//         const textEntities = textAnnotations.slice(1).map(item => ({
//             text: item.description,
//             boundingBox: item.boundingPoly?.vertices || []
//         }));
        
//         // 获取图像高度(通过顶点确定)
//         const imageHeight = textAnnotations[0]?.boundingPoly?.vertices?.[2]?.y || 0;
        
//         // 筛选底部文字(假设底部是指下面1/3区域)
//         const bottomThreshold = imageHeight * 0.7; // 取图像底部30%区域的文字
//         const bottomTextEntities = textEntities.filter(item => {
//             // 计算文本中心点的Y坐标
//             const vertices = item.boundingBox;
//             if (!vertices || vertices.length < 4) return false;
            
//             // 计算文本框底边的平均Y值
//             const bottomY = ((vertices[2]?.y || 0) + (vertices[3]?.y || 0)) / 2;
//             return bottomY > bottomThreshold;
//         });
        
//         // 按照X坐标排序底部文字(从左到右)
//         bottomTextEntities.sort((a, b) => {
//             const aX = a.boundingBox[0]?.x || 0;
//             const bX = b.boundingBox[0]?.x || 0;
//             return aX - bX;
//         });
        
//         // 将底部文字连接成一个字符串
//         const bottomText = bottomTextEntities.map(item => item.text).join(' ');
        
//         // 构建响应
//         const response = { 
//             success: true,
//             text: {
//                 fullText,
//                 textEntities,
//                 bottomText,
//                 bottomTextEntities
//             }
//         };
        
//         return c.json(response);
//     } catch (err: unknown) {
//         console.error('Google Vision API 处理错误:', err instanceof Error ? err.message : '未知错误');

//         // 根据错误类型返回不同的错误码和状态码
//         let statusCode = 500;
//         let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
//         let errorMessage = '服务器内部错误';

//         if (err instanceof Error) {
//             errorMessage = err.message;
            
//             // 识别特定类型的 Google Vision API 错误
//             if (errorMessage.includes('API')) {
//                 errorCode = ERROR_CODES.API_ERROR;
//             } else if (errorMessage.includes('credentials') || errorMessage.includes('authentication')) {
//                 errorCode = ERROR_CODES.API_KEY_MISSING;
//                 errorMessage = '未正确配置Google Cloud API密钥或API密钥无效';
//             }
//         }

//         return c.json({
//             success: false,
//             error: errorMessage,
//             errorCode: errorCode,
//             setupGuide: errorCode === ERROR_CODES.API_KEY_MISSING 
//                 ? '请在Google Cloud Console创建API密钥'
//                 : undefined,
//             stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
//         }, statusCode as ContentfulStatusCode);
//     }
//   });

// export default app 