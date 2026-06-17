"""
Django management command to enhance game metadata using AI.
"""
from django.core.management.base import BaseCommand
from pathlib import Path
from therapy.ai_metadata_enhancer import enhance_dataset_metadata


class Command(BaseCommand):
    help = "Enhance game metadata using AI (Groq API)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regeneration even if enhanced file exists',
        )

    def handle(self, *args, **options):
        base_dir = Path(__file__).resolve().parent.parent.parent
        input_file = base_dir / "data" / "labeled_game_images.json"
        output_file = base_dir / "data" / "labeled_game_images_enhanced.json"
        
        if output_file.exists() and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    f"Enhanced metadata already exists at {output_file}\n"
                    "Use --force to regenerate"
                )
            )
            return
        
        self.stdout.write("Starting AI metadata enhancement...")
        self.stdout.write(f"Input: {input_file}")
        self.stdout.write(f"Output: {output_file}\n")
        
        try:
            enhance_dataset_metadata(input_file, output_file)
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Successfully enhanced metadata!\n"
                    f"Enhanced file: {output_file}"
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"\n❌ Enhancement failed: {e}")
            )
