from db import get_db_connection

def test_connection():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()  # 获取查询结果
        print("Database connection successful!")
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    test_connection() 