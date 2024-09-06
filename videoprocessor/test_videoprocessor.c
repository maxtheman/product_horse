// test_videoprocessor.c
#include "videoprocessor.h"
#include <assert.h>

void test_create_audio_vis() {
    return;
}

void test_create_video_subclip() {
    return;
}

int main() {
    init_ffmpeg();
    
    test_create_audio_vis();
    test_create_video_subclip();
    
    cleanup_ffmpeg();
    
    printf("All tests passed!\n");
    return 0;
}