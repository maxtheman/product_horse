#include "videoprocessor.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Function implementations
void init_ffmpeg() {
    return;
}

void cleanup_ffmpeg() {
    return;
}

int create_audio_vis(Clip *clip, const char *output_path) {
    return 0;
}

int create_video_subclip(Clip *clip, const char *output_path) {
    return 0;
}

int stitch_clips(char **clip_paths, int clip_count, const char *output_path) {
    return 0;
}

EXPORT int process_clips(const char* input_json, const char* output_path) {
    return 0;
}