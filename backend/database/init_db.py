import mysql.connector
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def init_database():
    conn = None
    cursor = None
    try:
        # 首先创建数据库连接(不指定数据库)
        conn = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', '123456')
        )
        cursor = conn.cursor()
        
        # 创建数据库
        db_name = os.getenv('MYSQL_DB', 'image_annotation')
        
        # 检查数据库是否存在
        cursor.execute(f"SHOW DATABASES LIKE '{db_name}'")
        database_exists = cursor.fetchone() is not None
        
        if not database_exists:
            cursor.execute(f"CREATE DATABASE {db_name}")
            print(f"Database {db_name} successfully created!")
        else:
            print(f"Database {db_name} already exists")
        
        cursor.execute(f"USE {db_name}")
        
        # 检查表是否已经存在
        cursor.execute("SHOW TABLES")
        existing_tables = {table[0] for table in cursor.fetchall()}
        
        # 读取并执行 schema.sql
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            # 分割SQL语句
            statements = f.read().split(';')
            for statement in statements:
                statement = statement.strip()
                if statement:
                    try:
                        # 从语句中提取表名
                        if 'CREATE TABLE' in statement.upper():
                            table_name = statement.split('`' if '`' in statement else ' ')[2]
                            if table_name in existing_tables:
                                print(f"Table '{table_name}' already exists, skipping...")
                                continue
                            cursor.execute(statement)
                            print(f"Table '{table_name}' created successfully!")
                        else:
                            cursor.execute(statement)
                    except mysql.connector.Error as err:
                        if err.errno == 1050:  # 表已存在的错误码
                            print(f"Table '{table_name}' already exists, skipping...")
                        else:
                            print(f"SQL execution error: {err}")
                            raise
        
        conn.commit()
        print(f"\nDatabase {db_name} initialization completed!")
        
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    init_database() 