import os
import yt_dlp
import hashlib
from pathlib import Path

class MusicService:
    def __init__(self, download_dir: str = "voice_music"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)
        
    def get_md5_hash(self, text: str):
        return hashlib.md5(text.encode('utf-8')).hexdigest()

    async def search_and_download(self, song_name: str) -> str:
        """Search YouTube and return path to mp3"""
        song_hash = self.get_md5_hash(song_name)
        song_path = self.download_dir / f"{song_hash}.mp3"

        if song_path.exists():
            return str(song_path)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': str(self.download_dir / f"{song_hash}.%(ext)s"),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                search_query = f"ytsearch:{song_name} official audio"
                # This is a blocking call, for high-performance we should wrap in run_in_executor
                ydl.extract_info(search_query, download=True)
                return str(song_path)
        except Exception as e:
            print(f"Error searching song: {e}")
            return None

music_service = MusicService()
