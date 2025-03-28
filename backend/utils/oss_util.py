import os
import oss2
from dotenv import load_dotenv
from config.settings import ENABLE_OSS

# 加载 .env 文件
load_dotenv()

class OSSUtil:
    def __init__(self):
        # 检查是否启用OSS功能
        self.enabled = ENABLE_OSS
        if not self.enabled:
            print("OSS功能已禁用")
            self.auth = None
            self.bucket = None
            return
            
        # 从环境变量获取OSS配置
        self.access_key_id = os.getenv('ALIYUN_OSS_ACCESS_KEY_ID')
        self.access_key_secret = os.getenv('ALIYUN_OSS_ACCESS_KEY_SECRET')
        self.endpoint = os.getenv('ALIYUN_OSS_ENDPOINT')
        self.bucket_name = os.getenv('ALIYUN_OSS_BUCKET_NAME')
        
        # 检查配置是否有效
        if not all([self.access_key_id, self.access_key_secret, self.endpoint, self.bucket_name]):
            print("警告: OSS配置不完整，无法正常工作")
            self.enabled = False
            self.auth = None
            self.bucket = None
            return
        
        try:
            # 初始化Auth和Bucket
            self.auth = oss2.Auth(self.access_key_id, self.access_key_secret)
            self.bucket = oss2.Bucket(self.auth, self.endpoint, self.bucket_name)
            print(f"OSS初始化成功，连接到Bucket: {self.bucket_name}")
        except Exception as e:
            print(f"OSS初始化失败: {str(e)}")
            self.enabled = False
            self.auth = None
            self.bucket = None
    
    def upload_file(self, local_file_path, oss_file_path):
        """
        上传文件到OSS
        
        Args:
            local_file_path: 本地文件路径
            oss_file_path: OSS中的文件路径
            
        Returns:
            str: 文件URL或None（失败时）
        """
        if not self.enabled or not self.bucket:
            return None
            
        try:
            
            # 验证本地文件是否存在
            if not os.path.exists(local_file_path):
                print(f"本地文件不存在: {local_file_path}")
                return None
                
            # 上传文件
            result = self.bucket.put_object_from_file(oss_file_path, local_file_path)
            
            # 检查上传结果
            if result.status == 200:
                file_url = f"https://{self.bucket_name}.{self.endpoint}/{oss_file_path}"
                return file_url
            else:
                print(f"文件上传失败，状态码: {result.status}")
                return None
        except Exception as e:
            print(f"上传文件到OSS失败: {str(e)}")
            return None
    
    def delete_file(self, oss_file_path):
        """
        从OSS删除文件
        
        Args:
            oss_file_path: OSS中的文件路径
            
        Returns:
            bool: 是否删除成功
        """
        if not self.enabled or not self.bucket:
            return False
            
        try:
            
            # 检查文件是否存在
            exist = self.bucket.object_exists(oss_file_path)
            if not exist:
                print(f"OSS中不存在该文件: {oss_file_path}")
                return False
                
            # 删除文件
            result = self.bucket.delete_object(oss_file_path)
            
            # 检查删除结果
            if result.status == 204:  # OSS删除成功返回204状态码
                return True
            else:
                print(f"OSS文件删除失败，状态码: {result.status}")
                return False
        except Exception as e:
            print(f"从OSS删除文件失败: {str(e)}")
            return False
    
    def delete_folder(self, folder_path):
        """
        删除OSS中的文件夹及其内容
        
        Args:
            folder_path: OSS中的文件夹路径，确保以/结尾
            
        Returns:
            bool: 是否删除成功
        """
        if not self.enabled or not self.bucket:
            return False
            
        try:
            # 确保路径以/结尾
            if not folder_path.endswith('/'):
                folder_path += '/'
                
            
            # 列出要删除的文件
            file_list = []
            for obj in oss2.ObjectIterator(self.bucket, prefix=folder_path):
                file_list.append(obj.key)
                
            if not file_list:
                print(f"OSS中不存在该文件夹或文件夹为空: {folder_path}")
                return True  # 文件夹不存在也视为删除成功
                
            
            # 删除文件
            deleted_count = 0
            for file_path in file_list:
                try:
                    result = self.bucket.delete_object(file_path)
                    if result.status == 204:
                        deleted_count += 1
                    else:
                        print(f"删除文件失败: {file_path}, 状态码: {result.status}")
                except Exception as e:
                    print(f"删除文件出错: {file_path}, 错误: {str(e)}")
            
            return deleted_count > 0 or len(file_list) == 0
            
        except Exception as e:
            print(f"删除OSS文件夹失败: {str(e)}")
            return False
    
    def get_file_url(self, oss_file_path):
        """
        获取OSS文件的URL
        
        Args:
            oss_file_path: OSS中的文件路径
            
        Returns:
            str: 文件URL
        """
        if not self.enabled:
            return None
            
        return f"https://{self.bucket_name}.{self.endpoint}/{oss_file_path}" 