import axios from "axios";

const AddComment = async (postId, newComment, PostownerId, CurrentUserId) => {
    try {
        if (!newComment.trim()) return;
        if (!CurrentUserId) {
            console.log("User not logged in");
            return;
        }

        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/posts/comments/${postId}`,
            {
                userId: CurrentUserId,
                comment: newComment.trim(),
                PostownerId: PostownerId,
            }
        );

        if (res.data.ok) {
            console.log(res.data.comment);
            return {res: res.data.comment, ok: true};
        }
    } catch (err) {
        const Error = err?.response?.data?.message || err.message
        return {err: Error}
    }
}

export default AddComment;