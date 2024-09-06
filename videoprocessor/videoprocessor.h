#ifndef VIDEOPROCESSOR_H
#define VIDEOPROCESSOR_H

#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libavfilter/avfilter.h>
#include <libswscale/swscale.h>

// Structure definitions
typedef struct {
    char *text;
    double start_time;
    double end_time;
    char *color;
} Word;

typedef struct {
    char *file_path;
    double start_time;
    double end_time;
    Word *words;
    int word_count;
    int is_audio;
    int width;
    int height;
    int fps;
} Clip;

// Function declarations
void init_ffmpeg();
void cleanup_ffmpeg();
int create_audio_vis(Clip *clip, const char *output_path);
int create_video_subclip(Clip *clip, const char *output_path);
int stitch_clips(char **clip_paths, int clip_count, const char *output_path);

#ifdef _WIN32
#define EXPORT __declspec(dllexport)
#else
#define EXPORT
#endif

EXPORT int process_clips(const char* input_json, const char* output_path);

#endif // VIDEOPROCESSOR_H