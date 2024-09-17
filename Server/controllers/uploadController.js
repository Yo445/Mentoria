import 'dotenv/config';
import minioClient from '../config/minio.js';
import Course from '../models/courseModel.js';

const uploadFileToMinio = async (req, res) => {
    try {
        const file = req.file;
        if (!file){
            return res.status(400).json({message: 'No file provided'});
        }
        // console.log("bucket name", process.env.MINIO_BUCKET_NAME);

        const params = {
            bucket: process.env.MINIO_BUCKET_NAME,
            ObjectName: `${req.user.id}/${Date.now()}_${file.originalname}`,
            fileBuffer: file.buffer,
            mimeType: file.mimetype,
        };

        if (!params.bucket || typeof params.bucket !== 'string'){
            return res.status(400).json({ message: 'Invalid bucket name'});
        }

        const url = await minioClient.presignedPutObject(params.bucket, params.ObjectName, (err, url) => {
            if (err) throw err
            console.log('Presigned put url:', url, err)});

        const course = await Course.findById(req.body.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.materials.push({
            title: file.originalname,
            url,
            fileType: file.mimetype.split('/')[0],
            fileSize: file.size,
        });

        course.updatedAt = Date.now();

        await course.save();

        console.log("course", course);

        res.status(201).json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to upload file to Minio' });
    }
}

export { uploadFileToMinio };
