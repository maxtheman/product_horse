CC = gcc
# Compile with warnings and debugging information
CFLAGS = -Wall -Wextra -g
# Include the necessary libraries and their paths
LDFLAGS = -L/opt/homebrew/lib -lavformat -lavcodec -lavfilter -lswscale

# Update these paths if your FFmpeg headers are in a different location
INCLUDE_PATHS = -I/opt/homebrew/include

# Source files
SRC = videoprocessor.c
# intermediate object files: Source Code (.c) -> Object File (.o) -> Executable or Library
OBJ = $(SRC:.c=.o)
TEST_SRC = test_videoprocessor.c
TEST_OBJ = $(TEST_SRC:.c=.o)

all: libvideoprocessor.so test_runner

libvideoprocessor.so: $(OBJ)
	$(CC) -shared -o $@ $^ $(LDFLAGS)

test_runner: $(TEST_OBJ) libvideoprocessor.so
	$(CC) -o $@ $^ -L. -lvideoprocessor $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDE_PATHS) -c $< -o $@

clean:
	rm -f $(OBJ) $(TEST_OBJ) libvideoprocessor.so test_runner

test: test_runner
	./test_runner

.PHONY: all clean test

# make -- build the library
# make test -- run the tests
# make clean -- clean build files