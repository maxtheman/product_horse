use pyo3::prelude::*;
use numpy::{PyArray1, PyArray3, ToPyArray};
use std::io::Cursor;
use openh264::encoder::{Encoder, EncoderConfig, RateControlMode};
use av_format::output::mp4::{Mp4Muxer, Mp4MuxerConfig};
use av_codec::encoder::VideoEncoder;
use av_codec::packet::Packet;
use av_data::frame::VideoFrame;
use av_data::params::{VideoInfo, PixelFormat, Rational};

#[pyclass]
struct VideoProcessor {
    width: u32,
    height: u32,
    fps: f64,
}

#[pymethods]
impl VideoProcessor {
    #[new]
    fn new(width: u32, height: u32, fps: f64) -> Self {
        Self { width, height, fps }
    }

    fn encode_mp4(&self, py: Python, frames: Vec<PyObject>) -> PyResult<PyObject> {
        let mut output = Vec::new();
        let cursor = Cursor::new(&mut output);
        let muxer_config = Mp4MuxerConfig::default();
        let mut muxer = Mp4Muxer::new(cursor, muxer_config).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

        let time_base = Rational::new(1, self.fps as i32);
        let video_info = VideoInfo::new(self.width, self.height, false, PixelFormat::Yuv420p);
        let stream_id = muxer.add_video_stream(video_info, Some(time_base)).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

        let mut config = EncoderConfig::new(self.width, self.height);
        config.set_rate_control_mode(RateControlMode::Bitrate(1_000_000)); // 1 Mbps
        config.set_max_frame_rate(self.fps as f32);

        let mut encoder = Encoder::with_config(config).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

        for (i, frame_obj) in frames.iter().enumerate() {
            let frame: &PyArray3<u8> = frame_obj.extract(py)?;
            let frame_data = frame.as_array();
            let yuv_frame = Self::rgb_to_yuv420(&frame_data, self.width, self.height)?;

            let mut out = Vec::new();
            encoder.encode(&yuv_frame, &mut out).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

            if !out.is_empty() {
                let mut packet = Packet::new();
                packet.data = out;
                packet.stream_index = stream_id;
                packet.time_base = time_base;
                packet.pts = Some(i as i64);
                packet.dts = Some(i as i64);

                muxer.write_video_packet(&packet).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
            }
        }

        let mut out = Vec::new();
        encoder.flush(&mut out).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        if !out.is_empty() {
            let mut packet = Packet::new();
            packet.data = out;
            packet.stream_index = stream_id;
            packet.time_base = time_base;
            packet.pts = Some(frames.len() as i64);
            packet.dts = Some(frames.len() as i64);
            muxer.write_video_packet(&packet).map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        }

        muxer.write_trailer().map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

        Ok(PyArray1::from_vec(py, output).to_object(py))
    }
}

fn rgb_to_yuv420(rgb: &numpy::ArrayView3<u8>, width: u32, height: u32) -> PyResult<VideoFrame> {
    let mut yuv = VideoFrame::new(PixelFormat::Yuv420p, width, height);
    let y_plane = yuv.plane_mut(0);
    let u_plane = yuv.plane_mut(1);
    let v_plane = yuv.plane_mut(2);

    for y in 0..height {
        for x in 0..width {
            let r = rgb[[y as usize, x as usize, 0]] as f32;
            let g = rgb[[y as usize, x as usize, 1]] as f32;
            let b = rgb[[y as usize, x as usize, 2]] as f32;

            let y_value = 0.299 * r + 0.587 * g + 0.114 * b;
            let u_value = -0.14713 * r - 0.28886 * g + 0.436 * b + 128.0;
            let v_value = 0.615 * r - 0.51499 * g - 0.10001 * b + 128.0;

            y_plane[y as usize * y_plane.stride + x as usize] = y_value as u8;

            if y % 2 == 0 && x % 2 == 0 {
                let uv_index = (y / 2) as usize * u_plane.stride + (x / 2) as usize;
                u_plane[uv_index] = u_value as u8;
                v_plane[uv_index] = v_value as u8;
            }
        }
    }

    Ok(yuv)
}

#[pymodule]
fn rust_video_processor(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<VideoProcessor>()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use numpy::PyArray3;
    use pyo3::Python;

    #[test]
    fn test_video_processor_creation() {
        let processor = VideoProcessor::new(640, 480, 30.0);
        assert_eq!(processor.width, 640);
        assert_eq!(processor.height, 480);
        assert_eq!(processor.fps, 30.0);
    }

    #[test]
    fn test_rgb_to_yuv420() {
        Python::with_gil(|py| {
            let width = 4;
            let height = 4;
            let rgb_data = vec![
                255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 0,
                255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 0,
                0, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255, 255,
                0, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255, 255,
            ];
            let rgb_array = PyArray3::from_vec3(py, &[height as usize, width as usize, 3], rgb_data).unwrap();
            let yuv_frame = rgb_to_yuv420(&rgb_array.as_array(), width, height).unwrap();

            // Check dimensions
            assert_eq!(yuv_frame.width(), width);
            assert_eq!(yuv_frame.height(), height);

            // Check a few sample values
            // Y (Luma) plane
            assert_eq!(yuv_frame.data(0)[0], 76);  // Red
            assert_eq!(yuv_frame.data(0)[3], 149);  // Green
            assert_eq!(yuv_frame.data(0)[10], 29);  // Blue
            assert_eq!(yuv_frame.data(0)[15], 255);  // White

            // U (Cb) plane
            assert_eq!(yuv_frame.data(1)[0], 85);  // Average of top-left 2x2 block

            // V (Cr) plane
            assert_eq!(yuv_frame.data(2)[0], 255);  // Average of top-left 2x2 block
        });
    }

    #[test]
    fn test_encode_mp4() {
        Python::with_gil(|py| {
            let processor = VideoProcessor::new(4, 4, 1.0);
            let frame_data = vec![
                255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 0,
                255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 0,
                0, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255, 255,
                0, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255, 255,
            ];
            let frame = PyArray3::from_vec3(py, &[4, 4, 3], frame_data).unwrap();
            let frames = vec![frame.to_object(py)];

            let result = processor.encode_mp4(py, frames).unwrap();
            let output: &PyArray1<u8> = result.extract(py).unwrap();

            // Check if output is not empty
            assert!(output.len() > 0);

            // Check if output starts with the MP4 file signature
            let slice = output.as_slice().unwrap();
            assert_eq!(&slice[4..8], b"ftyp");  // MP4 file type box
        });
    }
}