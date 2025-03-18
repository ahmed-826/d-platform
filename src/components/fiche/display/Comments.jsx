"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  Trash,
  Edit,
  Save,
  X,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

import { useState } from "react";
import { useFiche } from "@/contexts/FicheContext";

const Comments = ({ commentsData }) => {
  const { entireMode } = useFiche();
  const [comments, setComments] = useState(commentsData);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [commentsCollapsed, setCommentsCollapsed] = useState(true);

  const updateComment = (id, text) => {
    if (!text.trim()) return;

    const updatedComments = comments.map((comment) =>
      comment.id === id ? { ...comment, text } : comment
    );

    setComments(updatedComments);
  };

  const addComment = (text) => {
    if (!text.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
  };

  const deleteComment = (id) => {
    const updatedComments = comments.filter((comment) => comment.id !== id);
    setComments(updatedComments);
  };

  const handleAddComment = () => {
    addComment(newComment);
    setNewComment("");
  };

  const handleDeleteComment = (id) => {
    deleteComment(id);
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = (id) => {
    updateComment(id, editText);
    setEditingId(null);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div
      className={`${commentsCollapsed ? "" : "h-1/4"} ${
        entireMode ? "hidden" : ""
      } overflow-hidden mt-4`}
    >
      {commentsCollapsed ? (
        <Button
          onClick={() => setCommentsCollapsed((prev) => !prev)}
          className="flex items-center justify-between w-full py-2 px-4 bg-muted/80 rounded-md shadow-sm hover:bg-muted transition-colors"
        >
          <span className="text-sm font-medium text-gray-900">
            Afficher les commentaires ({comments.length})
          </span>
          <ChevronUp className="transform rotate-180 text-gray-900" size={16} />
        </Button>
      ) : (
        <Card className="h-full border-t">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-4 space-y-0 bg-accent border-b">
            <div className="flex items-center">
              <MessageSquare size={16} className="mr-2 text-primary" />
              <CardTitle className="text-sm font-medium">
                Commentaires
              </CardTitle>
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCommentsCollapsed((prev) => !prev)}
              className="h-7 px-2"
              title="Masquer les commentaires"
            >
              <ChevronUp size={16} />
            </Button>
          </CardHeader>

          <CardContent className="p-3 flex flex-row h-[calc(100%-40px)] gap-3">
            <div className="w-1/3 flex flex-col gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="min-h-[80px] text-sm bg-white flex-1 resize-none"
              />
              <Button
                onClick={handleAddComment}
                size="sm"
                className="gap-1 w-full"
              >
                <PlusCircle size={14} /> Ajouter
              </Button>
            </div>

            <ScrollArea className="flex-1 w-2/3">
              <div className="space-y-2">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-20 text-center">
                    <MessageSquare
                      size={20}
                      className="text-muted-foreground opacity-40 mb-1"
                    />
                    <div className="text-sm text-muted-foreground">
                      Aucun commentaire
                    </div>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border rounded-md p-2 bg-gray-50 animate-scale-in"
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comment.timestamp)}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => startEditing(comment)}
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash size={12} />
                          </Button>
                        </div>
                      </div>

                      {editingId === comment.id ? (
                        <div className="mt-1">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[60px] mt-1 mb-1 text-sm"
                            placeholder="Modifier votre commentaire..."
                          />
                          <div className="flex justify-end space-x-1 mt-1">
                            <Button
                              variant="outline"
                              size="xs"
                              className="h-6 text-xs px-4 py-4"
                              onClick={cancelEditing}
                            >
                              <X size={10} className="mr-1" /> Annuler
                            </Button>
                            <Button
                              size="xs"
                              className="h-6 text-xs px-4 py-4"
                              onClick={() => saveEdit(comment.id)}
                            >
                              <Save size={10} className="mr-1" /> Enregistrer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Comments;
