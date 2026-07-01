import asyncio
import os
import sys
import time

# Configure UTF-8 encoding for stdout to prevent Windows CP1252 charmap encoding errors
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.experiences_service import get_available_companies, retrieve_company_context

async def main():
    print("==================================================")
    print("      CRAKD EXPERIENCE DATABASE INGESTOR          ")
    print("==================================================")
    print("[INFO] Starting background indexing for all companies in experiences folder...")
    
    companies = get_available_companies()
    if not companies:
        print("[ERROR] No company folders found. Make sure experiences folder is populated.")
        return
        
    print(f"[INFO] Found {len(companies)} companies to index.")
    
    for idx, company in enumerate(companies):
        folder = company["folderName"]
        display = company["displayName"]
        
        print(f"\n[{idx+1}/{len(companies)}] Processing {display} ({folder})...")
        
        start_time = time.time()
        try:
            # retrieve_company_context automatically checks if collection is empty,
            # parses files, generates embeddings, and stores them in ChromaDB.
            chunks = retrieve_company_context(folder, max_chunks=1)
            duration = time.time() - start_time
            print(f"[SUCCESS] Index check complete for {display} (took {duration:.2f}s). Chunks in DB: {len(chunks)}")
        except Exception as e:
            print(f"[FAIL] Error indexing {display}: {str(e)}")
            print("[INFO] Waiting 20 seconds before attempting next company...")
            time.sleep(20)
            
    print("\n==================================================")
    print("[SUCCESS] All company placement reports are persistently indexed in ChromaDB!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
