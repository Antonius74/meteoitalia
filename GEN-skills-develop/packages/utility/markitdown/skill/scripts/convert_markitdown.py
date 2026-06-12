#!/usr/bin/env python3
"""Convert explicit inputs to Markdown with Microsoft MarkItDown."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ARCHIVE_SUFFIXES = {".zip", ".tar", ".tgz", ".gz", ".bz2", ".xz", ".7z", ".rar"}
REMOTE_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*://")
INSTALL_COMMAND = 'python -m pip install "markitdown[all]"'


@dataclass(frozen=True)
class Conversion:
    input: str
    output: str


@dataclass(frozen=True)
class Failure:
    input: str
    error: str


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    output_dir = Path(args.output_dir)

    validation_error = validate_inputs(args.inputs, args.allow_remote, args.allow_archives)
    if validation_error is not None:
        print(validation_error, file=sys.stderr)
        return 1

    output_error = validate_outputs(args.inputs, output_dir, args.overwrite)
    if output_error is not None:
        print(output_error, file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        converter_class = load_markitdown()
    except ImportError:
        message = (
            "Microsoft MarkItDown is not installed. "
            f"Install it with: {INSTALL_COMMAND}"
        )
        if args.json:
            print(json.dumps({"converted": [], "failed": [{"input": "", "error": message}], "skipped": []}))
        else:
            print(message, file=sys.stderr)
        return 2

    converter = converter_class()
    converted: list[Conversion] = []
    failed: list[Failure] = []

    for source in args.inputs:
        output_path = output_path_for(source, output_dir)
        try:
            markdown = convert_input(converter, source, args.allow_remote)
            output_path.write_text(markdown.rstrip() + "\n", encoding="utf8")
            converted.append(Conversion(input=source, output=str(output_path)))
        except Exception as error:
            failed.append(Failure(input=source, error=str(error)))

    if args.json:
        print(
            json.dumps(
                {
                    "converted": [conversion.__dict__ for conversion in converted],
                    "failed": [failure.__dict__ for failure in failed],
                    "skipped": [],
                },
                indent=2,
            )
        )
    else:
        for conversion in converted:
            print(f"converted: {conversion.input} -> {conversion.output}")
        for failure in failed:
            print(f"failed: {failure.input}: {failure.error}", file=sys.stderr)

    return 1 if failed else 0


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert explicit inputs to Markdown with Microsoft MarkItDown.")
    parser.add_argument("inputs", nargs="+", help="Explicit file paths. Remote URIs require --allow-remote.")
    parser.add_argument("--output-dir", required=True, help="Directory where Markdown files will be written.")
    parser.add_argument("--overwrite", action="store_true", help="Allow replacing existing Markdown output files.")
    parser.add_argument("--allow-remote", action="store_true", help="Allow remote URI inputs.")
    parser.add_argument("--allow-archives", action="store_true", help="Allow archive inputs such as .zip files.")
    parser.add_argument("--json", action="store_true", help="Emit a JSON summary.")
    return parser.parse_args(argv)


def load_markitdown() -> Any:
    from markitdown import MarkItDown

    return MarkItDown


def validate_inputs(inputs: list[str], allow_remote: bool, allow_archives: bool) -> str | None:
    for source in inputs:
        if is_remote(source):
            if not allow_remote:
                return f"Remote input requires --allow-remote: {source}"
            if is_archive_source(source) and not allow_archives:
                return f"Archive input requires --allow-archives: {source}"
            continue

        source_path = Path(source)
        if not source_path.exists():
            return f"Input does not exist: {source}"
        if not source_path.is_file():
            return f"Input must be an explicit file path: {source}"
        if is_archive_source(source) and not allow_archives:
            return f"Archive input requires --allow-archives: {source}"

    return None


def validate_outputs(inputs: list[str], output_dir: Path, overwrite: bool) -> str | None:
    seen: set[str] = set()
    for source in inputs:
        output_path = output_path_for(source, output_dir)
        output_key = output_path.name.casefold()
        if output_key in seen:
            return f"Duplicate output path for input stem: {output_path}"
        seen.add(output_key)
        if output_path.exists() and not overwrite:
            return f"Output already exists; rerun with --overwrite to replace it: {output_path}"
    return None


def output_path_for(source: str, output_dir: Path) -> Path:
    if is_remote(source):
        stem = Path(source.rstrip("/")).stem or "remote"
    else:
        stem = Path(source).stem
    return output_dir / f"{stem}.md"


def convert_input(converter: Any, source: str, allow_remote: bool) -> str:
    if is_remote(source):
        if not allow_remote:
            raise ValueError(f"Remote input requires --allow-remote: {source}")
        result = converter.convert(source)
    elif hasattr(converter, "convert_local"):
        result = converter.convert_local(source)
    else:
        result = converter.convert(source)

    markdown = getattr(result, "text_content", None)
    if markdown is None:
        markdown = getattr(result, "markdown", None)
    if markdown is None:
        markdown = str(result)
    return str(markdown)


def is_remote(source: str) -> bool:
    return REMOTE_PATTERN.match(source) is not None


def is_archive_source(source: str) -> bool:
    normalized_source = source.rstrip("/")
    if is_remote(source):
        normalized_source = normalized_source.split("?", 1)[0].split("#", 1)[0]
    suffixes = [suffix.lower() for suffix in Path(normalized_source).suffixes]
    return any(suffix in ARCHIVE_SUFFIXES for suffix in suffixes)


if __name__ == "__main__":
    raise SystemExit(main())
